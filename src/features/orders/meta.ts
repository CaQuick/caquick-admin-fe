import {
  type OrderActorType,
  type OrderCancelFaultType,
  type OrderCancelReasonType,
  type PaymentConfirmSourceType,
  type PaymentMethodType,
  type PaymentStatusType,
  type RefundKindType,
  type RefundStatusType,
} from '@/graphql/generated/graphql';
import { type PillTone } from '@/shared/ui/status-pill';

// Record라 codegen enum에 값이 늘면 tsc가 잡는다. 화면은 모르는 값이 와도 원문으로 보인다
const ACTOR: Record<OrderActorType, string> = {
  BUYER: '구매자',
  SELLER: '판매자',
  ADMIN: '관리자',
  SYSTEM: '시스템',
};
// BE 사유 라벨과 같은 문구(이력에는 라벨이 따로 오지 않는다)
const CANCEL_REASON: Record<OrderCancelReasonType, string> = {
  DESIGN_NOT_FEASIBLE: '제작할 수 없는 디자인',
  OUT_OF_MATERIALS: '재료 소진',
  SCHEDULE_UNAVAILABLE: '일정 불가',
  INAPPROPRIATE_REQUEST: '부적절한 요청',
  BUYER_REQUEST: '구매자 요청',
  OTHER: '기타',
  PAYMENT_NOT_RECEIVED: '미입금',
  CONFIRM_TIMEOUT: '판매자 미확정',
};
const CANCEL_FAULT: Record<OrderCancelFaultType, string> = {
  SELLER: '판매자 사정',
  BUYER: '구매자 사정',
};
const REFUND_KIND: Record<RefundKindType, string> = {
  CANCEL: '취소 환불',
  DEPOSIT_RETURN: '입금 반환',
};
const REFUND_STATUS: Record<RefundStatusType, { label: string; tone: PillTone }> = {
  AWAITING_ACCOUNT: { label: '계좌 입력 대기', tone: 'caution' },
  AWAITING_TRANSFER: { label: '송금 대기', tone: 'primary' },
  COMPLETED: { label: '송금 완료', tone: 'positive' },
};
const PAYMENT_METHOD: Record<PaymentMethodType, string> = {
  BANK_TRANSFER: '계좌이체',
  TOSS: '토스',
};
const PAYMENT_STATUS: Record<PaymentStatusType, { label: string; tone: PillTone }> = {
  PENDING: { label: '입금 대기', tone: 'neutral' },
  CONFIRMED: { label: '입금 확인', tone: 'positive' },
  CANCELED: { label: '입금 전 취소', tone: 'negative' },
};
const CONFIRM_SOURCE: Record<PaymentConfirmSourceType, string> = {
  AUTO: '자동 매칭',
  ADMIN: '관리자 확인',
};

/** 표에 있는 값만 바꾼다. `constructor` 같은 프로토타입 키도 모르는 값이다 */
const label = (table: Record<string, string>, value: string) =>
  Object.hasOwn(table, value) ? table[value]! : value;
const pill = (table: Record<string, { label: string; tone: PillTone }>, value: string) =>
  Object.hasOwn(table, value) ? table[value]! : { label: value, tone: 'neutral' as const };

export const actorLabel = (v: string) => label(ACTOR, v);
export const cancelReasonLabel = (v: string) => label(CANCEL_REASON, v);
export const cancelFaultLabel = (v: string) => label(CANCEL_FAULT, v);
export const refundKindLabel = (v: string) => label(REFUND_KIND, v);
export const refundStatusMeta = (v: string) => pill(REFUND_STATUS, v);
export const paymentMethodLabel = (v: string) => label(PAYMENT_METHOD, v);
export const paymentStatusMeta = (v: string) => pill(PAYMENT_STATUS, v);
export const confirmSourceLabel = (v: string) => label(CONFIRM_SOURCE, v);

/** 수수료율 bp(1bp = 0.01%) → '5.55%'. 정수 ÷ 100은 가장 가까운 double이라 소수 둘째 자리까지 그대로 찍힌다 */
export const formatBps = (bps: number) => `${bps / 100}%`;
