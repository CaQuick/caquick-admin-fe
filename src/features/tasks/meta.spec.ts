import { ApiError } from '@/shared/api';

import {
  actorLabel,
  isAmountInvalid,
  isAmountMismatch,
  isConflict,
  loadDescription,
  nextTask,
  pickupTone,
  recordKindLabel,
  refundKindLabel,
  refundStatusMeta,
  taskBadges,
} from './meta';

describe('pickupTone', () => {
  const now = new Date('2026-11-19T03:00:00.000Z');
  const at = (ms: number) => new Date(now.getTime() + ms).toISOString();
  const H = 3600_000;

  it.each([
    ['지난 시각', at(-1), 'negative'],
    ['지금(경계)', at(0), 'negative'],
    ['1ms 뒤', at(1), 'caution'],
    ['3시간 1ms 전', at(3 * H - 1), 'caution'],
    ['3시간 뒤(경계)', at(3 * H), null],
    ['하루 뒤', at(24 * H), null],
  ])('%s → %s', (_, pickupAt, want) => {
    expect(pickupTone(pickupAt, now)).toBe(want);
  });
});

describe('nextTask', () => {
  it.each([
    ['목록을 아직 못 받음', undefined, undefined, '1', { nextId: null, remaining: 0 }],
    ['방금 처리한 건이 아직 목록에 있음', ['1', '2', '3'], 3, '1', { nextId: '2', remaining: 2 }],
    ['다시 받아 빠짐', ['2', '3'], 2, '1', { nextId: '2', remaining: 2 }],
    ['목록 밖에서 연 건', ['2'], 5, '9', { nextId: '2', remaining: 5 }],
    ['마지막 건', ['1'], 1, '1', { nextId: null, remaining: 0 }],
    ['빈 목록', [], 0, '1', { nextId: null, remaining: 0 }],
    ['이 페이지엔 없지만 남음', [], 4, '1', { nextId: null, remaining: 4 }],
    ['ID "0"도 다음 건이다', ['1', '0'], 2, '1', { nextId: '0', remaining: 1 }],
  ])('%s', (_, ids, total, current, want) => {
    expect(nextTask(ids, total, current)).toEqual(want);
  });
});

describe('taskBadges', () => {
  it('계좌 입력 대기 환불은 배지 합계에 넣지 않는다', () => {
    expect(
      taskBadges({
        claimedPayments: 2,
        pendingPayments: 5,
        refundsAwaitingAccount: 7,
        refundsAwaitingTransfer: 3,
        pendingSettlements: 1,
      }),
    ).toEqual({ deposits: 5, refunds: 3, settlements: 1, total: 9 });
  });
});

describe('라벨', () => {
  it.each([
    [refundKindLabel, 'CANCEL', '취소 환불'],
    [refundKindLabel, 'DEPOSIT_RETURN', '입금 반환'],
    [recordKindLabel, 'RETURN', '반환'],
    [recordKindLabel, 'UNIDENTIFIED', '종결'],
    [actorLabel, 'BUYER', '구매자'],
    [actorLabel, 'SELLER', '판매자'],
    [actorLabel, 'ADMIN', '관리자'],
    [actorLabel, 'SYSTEM', '자동'],
  ])('%#: %s → %s', (fn, value, want) => {
    expect(fn(value)).toBe(want);
  });

  it.each(['NEW_VALUE', 'constructor', 'toString', ''])('모르는 값 "%s"는 원문으로 보인다', (v) => {
    expect(refundKindLabel(v)).toBe(v);
    expect(recordKindLabel(v)).toBe(v);
    expect(actorLabel(v)).toBe(v);
    expect(refundStatusMeta(v)).toEqual({ label: v, tone: 'neutral' });
  });

  it('환불 상태는 송금 대기만 주의 톤이다', () => {
    expect(refundStatusMeta('AWAITING_ACCOUNT')).toEqual({
      label: '계좌 입력 대기',
      tone: 'neutral',
    });
    expect(refundStatusMeta('AWAITING_TRANSFER')).toEqual({ label: '송금 대기', tone: 'caution' });
    expect(refundStatusMeta('COMPLETED')).toEqual({ label: '송금 완료', tone: 'positive' });
  });
});

describe('오류 분류', () => {
  const err = (classification: 'CONFLICT' | 'BAD_USER_INPUT', code: string) =>
    new ApiError('msg', classification, code, 200);

  it('CONFLICT 분류만 충돌로 본다', () => {
    expect(isConflict(err('CONFLICT', 'PAYMENT_NOT_PENDING'))).toBe(true);
    expect(isConflict(err('BAD_USER_INPUT', 'DEPOSIT_AMOUNT_MISMATCH'))).toBe(false);
    expect(isConflict(new Error('x'))).toBe(false);
  });

  it('입금액 오류 코드를 구분한다', () => {
    expect(isAmountMismatch(err('BAD_USER_INPUT', 'DEPOSIT_AMOUNT_MISMATCH'))).toBe(true);
    expect(isAmountMismatch(err('BAD_USER_INPUT', 'DEPOSIT_AMOUNT_INVALID'))).toBe(false);
    expect(isAmountInvalid(err('BAD_USER_INPUT', 'DEPOSIT_AMOUNT_INVALID'))).toBe(true);
    expect(isAmountInvalid('DEPOSIT_AMOUNT_INVALID')).toBe(false);
  });

  it('단건 읽기 문구는 오류 → 읽는 중 → 요약 순이다', () => {
    expect(loadDescription(true, err('CONFLICT', 'X'), '요약')).toBe('msg');
    expect(loadDescription(true, null, '요약')).toBe('불러오고 있습니다.');
    expect(loadDescription(false, null, '요약')).toBe('요약');
  });
});
