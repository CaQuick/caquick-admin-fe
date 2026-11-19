import { type CancelRefundRuleType } from '@/graphql/generated/graphql';

import {
  CANCEL_NOTE_MAX,
  type CancelForm,
  type CancelOptions,
  EMPTY_CANCEL_FORM,
  buildCancelInput,
  cancelSummary,
  noteLength,
  parseRefundAmount,
} from './cancel-form';

const PAID = 30000;
const options = (refundRule: CancelRefundRuleType | null, paidAmount = PAID): CancelOptions => ({
  cancelable: refundRule !== null,
  reasons: ['OUT_OF_MATERIALS', 'OTHER'],
  refundRule,
  paidAmount,
});
const form = (patch: Partial<CancelForm> = {}): CancelForm => ({
  ...EMPTY_CANCEL_FORM,
  reason: 'OTHER',
  ...patch,
});
const base = { orderId: '0', reason: 'OTHER', note: null };

describe('buildCancelInput', () => {
  const FAULTS = ['', 'SELLER', 'BUYER'] as const;
  const AMOUNTS = ['', '0', ' 7 ', '30000', '30001', '-1', '1.5', '1e3', '３'];

  /** 기대값은 구현과 따로: BY_FAULT만 사정을 묻고, 구매자 사정만 0~결제액 정수 금액을 받는다 */
  function expected(rule: CancelRefundRuleType, fault: string, amount: string) {
    if (rule !== 'BY_FAULT') return { input: base };
    if (fault === '') return { issue: 'FAULT_REQUIRED' };
    if (fault === 'SELLER') return { input: { ...base, fault: 'SELLER' } };
    if (amount === '') return { issue: 'AMOUNT_REQUIRED' };
    const ok: Record<string, number> = { '0': 0, ' 7 ': 7, '30000': 30000 };
    return amount in ok
      ? { input: { ...base, fault: 'BUYER', refundAmount: ok[amount] } }
      : { issue: 'AMOUNT_OUT_OF_RANGE' };
  }

  const cases = (['NO_REFUND', 'FULL_REFUND', 'BY_FAULT'] as const).flatMap((rule) =>
    FAULTS.flatMap((fault) =>
      AMOUNTS.map((amount) => [rule, fault, amount, expected(rule, fault, amount)] as const),
    ),
  );

  it('표는 규칙 3 × 사정 3 × 금액 9를 덮고 금액을 보내는 경우는 3개다', () => {
    expect(cases).toHaveLength(81);
    const withAmount = cases.filter(([, , , r]) => 'refundAmount' in (r.input ?? {}));
    expect(withAmount).toHaveLength(3);
  });

  it.each(cases)('%s fault=%j 금액=%j → %j', (rule, fault, refundAmount, result) => {
    // ID "0"도 그대로 보낸다
    expect(buildCancelInput('0', options(rule), form({ fault, refundAmount }))).toEqual(result);
  });

  it('결제액이 0이면 구매자 사정 금액은 0만 받는다', () => {
    const o = options('BY_FAULT', 0);
    expect(buildCancelInput('1', o, form({ fault: 'BUYER', refundAmount: '0' }))).toMatchObject({
      input: { refundAmount: 0 },
    });
    expect(buildCancelInput('1', o, form({ fault: 'BUYER', refundAmount: '1' }))).toEqual({
      issue: 'AMOUNT_OUT_OF_RANGE',
    });
  });

  it.each([
    ['고르지 않은 사유', { reason: '' }],
    ['선택지에 없는 사유', { reason: 'PAYMENT_NOT_RECEIVED' }],
    ['프로토타입 키', { reason: 'constructor' }],
  ])('%s는 REASON_REQUIRED', (_, patch) => {
    expect(buildCancelInput('1', options('FULL_REFUND'), form(patch))).toEqual({
      issue: 'REASON_REQUIRED',
    });
  });

  it('취소할 수 없는 주문은 입력과 관계없이 NOT_CANCELABLE', () => {
    expect(buildCancelInput('1', { ...options('FULL_REFUND'), cancelable: false }, form())).toEqual(
      { issue: 'NOT_CANCELABLE' },
    );
  });

  it.each([
    ['앞뒤 공백은 빼고 보낸다', '  재고 없음  ', '재고 없음'],
    ['공백만이면 null', '   ', null],
    ['이모지 500자는 받는다', '🎂'.repeat(CANCEL_NOTE_MAX), '🎂'.repeat(CANCEL_NOTE_MAX)],
  ])('메모: %s', (_, note, sent) => {
    expect(buildCancelInput('1', options('FULL_REFUND'), form({ note }))).toEqual({
      input: { orderId: '1', reason: 'OTHER', note: sent },
    });
  });

  it('메모는 코드 포인트 501자부터 NOTE_TOO_LONG', () => {
    expect(noteLength(` ${'🎂'.repeat(CANCEL_NOTE_MAX)} `)).toBe(CANCEL_NOTE_MAX);
    expect(
      buildCancelInput('1', options('NO_REFUND'), form({ note: 'a'.repeat(CANCEL_NOTE_MAX + 1) })),
    ).toEqual({ issue: 'NOTE_TOO_LONG' });
  });
});

describe('parseRefundAmount', () => {
  it.each([
    ['0', 0],
    ['007', 7],
    ['30000', 30000],
    ['30001', null],
    ['', null],
    ['1,000', null],
    ['99999999999999999999', null],
  ])('%j → %s', (raw, n) => {
    expect(parseRefundAmount(raw, PAID)).toBe(n);
  });
});

describe('cancelSummary', () => {
  it.each([
    ['NO_REFUND', {}, PAID, '입금 전 주문이라 환불 없이 취소합니다.'],
    ['FULL_REFUND', {}, PAID, '결제액 30,000원을 전액 환불합니다.'],
    ['FULL_REFUND', {}, 0, '확인된 결제액이 없어 환불 없이 취소합니다.'],
    ['BY_FAULT', {}, PAID, '사정을 고르면 환불 금액이 정해집니다.'],
    ['BY_FAULT', { fault: 'SELLER' }, PAID, '판매자 사정이라 결제액 30,000원을 전액 환불합니다.'],
    [
      'BY_FAULT',
      { fault: 'BUYER', refundAmount: '0' },
      PAID,
      '0원을 환불하고, 남은 30,000원은 수수료를 뺀 뒤 매장 정산에 포함합니다.',
    ],
    [
      'BY_FAULT',
      { fault: 'BUYER', refundAmount: '10000' },
      PAID,
      '10,000원을 환불하고, 남은 20,000원은 수수료를 뺀 뒤 매장 정산에 포함합니다.',
    ],
    [
      'BY_FAULT',
      { fault: 'BUYER', refundAmount: '30000' },
      PAID,
      '결제액 30,000원을 전액 환불합니다.',
    ],
    [
      'BY_FAULT',
      { fault: 'BUYER', refundAmount: '' },
      PAID,
      '환불 금액을 0원~30,000원 사이 정수로 입력하세요.',
    ],
  ] as const)('%s %j 결제액 %i → %s', (rule, patch, paid, text) => {
    expect(cancelSummary(options(rule, paid), form(patch))).toBe(text);
  });

  it('취소할 수 없거나 모르는 규칙이면 요약이 없다', () => {
    expect(cancelSummary(options(null), form())).toBeNull();
    expect(cancelSummary(options('PARTIAL' as CancelRefundRuleType), form())).toBeNull();
  });
});
