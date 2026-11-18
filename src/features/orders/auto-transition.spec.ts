import { type OrderStatusType } from '@/graphql/generated/graphql';

import { autoTransitionNote } from './auto-transition';

const payment = (buyerClaimedAt: string | null) => ({
  method: 'BANK_TRANSFER' as const,
  status: 'PENDING' as const,
  amount: 30000,
  depositorName: '김서연',
  depositAccountNumber: '1002123456789',
  depositAccountHolder: '케이퀵',
  expiresAt: '2026-11-19T01:00:00.000Z',
  buyerClaimedAt,
  confirmedAt: null,
  confirmSource: null,
  confirmedByLabel: null,
  confirmNote: null,
  depositBank: { code: '020', name: '우리은행' },
});
const order = (status: OrderStatusType, patch: object = {}) => ({
  status,
  payment: payment(null),
  confirmDeadlineAt: null,
  autoPickupAt: null,
  ...patch,
});
const AT = '2026-11-20T05:00:00.000Z';

describe('autoTransitionNote', () => {
  it.each([
    [
      '입금 대기는 입금 기한',
      order('PENDING_PAYMENT'),
      false,
      '11-19 10:00까지 입금이 확인되지 않으면 자동 취소됩니다.',
    ],
    [
      "'입금했어요'를 누른 입금 대기는 자동 취소에서 빠진다",
      order('PENDING_PAYMENT', { payment: payment('2026-11-19T00:30:00.000Z') }),
      false,
      '구매자가 11-19 09:30에 입금했다고 알려 자동 취소되지 않습니다. 입금을 확인하거나 미입금으로 취소하세요.',
    ],
    [
      '접수는 확정 마감',
      order('SUBMITTED', { confirmDeadlineAt: AT }),
      true,
      '11-20 14:00까지 판매자가 확정하지 않으면 자동 취소·전액 환불됩니다.',
    ],
    [
      '확정은 자동 픽업 완료',
      order('CONFIRMED', { autoPickupAt: AT }),
      false,
      '11-20 14:00에 자동으로 픽업 완료됩니다.',
    ],
    [
      '숨김 매장의 제작 완료는 직접 처리 안내',
      order('MADE', { autoPickupAt: AT }),
      true,
      '매장이 숨김이라 11-20 14:00에 자동 픽업 완료되지 않습니다. 픽업 완료나 강제 취소로 직접 처리하세요.',
    ],
    ['결제 도입 전 입금 대기는 없음', order('PENDING_PAYMENT', { payment: null }), false, null],
    ['결제 도입 전 접수(마감 null)는 없음', order('SUBMITTED'), false, null],
    ['종료 상태는 없음', order('PICKED_UP'), false, null],
  ])('%s', (_, o, hidden, note) => {
    expect(autoTransitionNote(o, hidden)).toBe(note);
  });
});
