import { ApiError } from '@/shared/api';

import {
  FORM_MESSAGES,
  confirmPaymentSchema,
  depositFormError,
  depositReturnSchema,
  emptyDeposit,
  toConfirmPaymentInput,
  toDepositReturnInput,
  toUnidentifiedDepositInput,
  unidentifiedDepositSchema,
} from './forms';

const issues = (r: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}) => (r.success ? [] : r.error!.issues.map((i) => [i.path.join('.'), i.message]));

describe('입금 확인 폼', () => {
  it.each([
    ['0', true],
    ['12,000', true],
    ['', false],
    ['-1', false],
    ['1.5', false],
  ])('입금액 "%s" → 유효 %s(0원 주문은 0으로 확인)', (depositedAmount, ok) => {
    expect(confirmPaymentSchema.safeParse({ depositedAmount, note: '' }).success).toBe(ok);
  });

  it('메모는 500자(코드 포인트)까지다', () => {
    expect(
      confirmPaymentSchema.safeParse({ depositedAmount: '1', note: '😀'.repeat(500) }).success,
    ).toBe(true);
    expect(
      issues(confirmPaymentSchema.safeParse({ depositedAmount: '1', note: '가'.repeat(501) })),
    ).toEqual([['note', FORM_MESSAGES.noteTooLong]]);
  });

  it('입력을 정수·정리된 메모로 바꾼다', () => {
    expect(toConfirmPaymentInput('0', { depositedAmount: '12,000', note: '  확인  ' })).toEqual({
      orderId: '0',
      depositedAmount: 12000,
      note: '확인',
    });
    expect(toConfirmPaymentInput('1', { depositedAmount: '0', note: ' ' }).note).toBeNull();
  });
});

describe('입금 기록 폼', () => {
  const valid = emptyDeposit({ amount: '9000', depositorName: '김구매' });

  it('반환 연결은 메모 없이 저장할 수 있다', () => {
    expect(depositReturnSchema.safeParse(valid).success).toBe(true);
  });

  it('종결 기록은 메모가 필수다(공백만은 비운 것)', () => {
    expect(issues(unidentifiedDepositSchema.safeParse({ ...valid, note: '  ' }))).toEqual([
      ['note', FORM_MESSAGES.noteRequired],
    ]);
    expect(unidentifiedDepositSchema.safeParse({ ...valid, note: '확인 불가' }).success).toBe(true);
  });

  it.each([
    [{ amount: '0' }, 'amount', FORM_MESSAGES.amount],
    [{ amount: '' }, 'amount', FORM_MESSAGES.amount],
    [{ depositorName: '  ' }, 'depositorName', FORM_MESSAGES.depositorRequired],
    [{ depositorName: '가'.repeat(51) }, 'depositorName', FORM_MESSAGES.depositorTooLong],
    [{ note: '가'.repeat(501) }, 'note', FORM_MESSAGES.noteTooLong],
  ])('%o → %s 오류', (over, path, message) => {
    expect(issues(depositReturnSchema.safeParse({ ...valid, ...over }))).toEqual([[path, message]]);
  });

  it('입금자명 50자는 통과한다', () => {
    expect(
      depositReturnSchema.safeParse({ ...valid, depositorName: '가'.repeat(50) }).success,
    ).toBe(true);
  });

  it('입금 일시는 KST로 읽어 UTC로 보내고 비우면 null', () => {
    expect(
      toDepositReturnInput('7', { ...valid, depositedAt: '2026-11-19T10:30', note: ' 늦은 입금 ' }),
    ).toEqual({
      orderId: '7',
      amount: 9000,
      depositorName: '김구매',
      depositedAt: '2026-11-19T01:30:00.000Z',
      note: '늦은 입금',
    });
    expect(toUnidentifiedDepositInput({ ...valid, note: ' 메모 ' })).toEqual({
      amount: 9000,
      depositorName: '김구매',
      depositedAt: null,
      note: '메모',
    });
  });
});

describe('depositFormError', () => {
  const api = (classification: 'BAD_USER_INPUT' | 'NOT_FOUND', code: string) =>
    new ApiError('서버 문구', classification, code, 200);

  it.each([
    [api('BAD_USER_INPUT', 'DEPOSIT_AMOUNT_INVALID'), { field: 'amount', inForm: true }],
    [api('BAD_USER_INPUT', 'DEPOSIT_NOTE_REQUIRED'), { field: 'note', inForm: true }],
    [api('BAD_USER_INPUT', 'TEXT_TOO_LONG'), { field: null, inForm: true, message: '서버 문구' }],
    [api('NOT_FOUND', 'ORDER_NOT_FOUND'), { field: null, inForm: false, message: '서버 문구' }],
    [new Error('x'), { field: null, inForm: false }],
  ])('%#', (e, want) => {
    expect(depositFormError(e)).toMatchObject(want);
  });
});
