import { type OrderStatusType } from '@/graphql/generated/graphql';
import { type PillTone } from '@/shared/ui/status-pill';

// Record라 codegen enum에 값이 늘면 tsc가 잡는다. 적은 순서가 필터·차트 순서다(흐름 → 종료 상태)
const META: Record<OrderStatusType, { label: string; tone: PillTone }> = {
  PENDING_PAYMENT: { label: '입금 대기', tone: 'neutral' },
  SUBMITTED: { label: '접수', tone: 'primary' },
  CONFIRMED: { label: '주문 확정', tone: 'caution' },
  MADE: { label: '제작 완료', tone: 'neutral' },
  PICKED_UP: { label: '픽업 완료', tone: 'positive' },
  NO_SHOW: { label: '노쇼', tone: 'negative' },
  CANCELED: { label: '취소', tone: 'negative' },
};

export const ORDER_STATUS = (Object.keys(META) as OrderStatusType[]).map((value) => ({
  value,
  ...META[value],
}));

export const ORDER_STATUS_VALUES = ORDER_STATUS.map((s) => s.value) as [
  OrderStatusType,
  ...OrderStatusType[],
];

/** BE가 먼저 배포돼 모르는 값이 와도 원문으로 보인다 */
export function orderStatusMeta(value: OrderStatusType) {
  return Object.hasOwn(META, value)
    ? { value, ...META[value] }
    : { value, label: value as string, tone: 'neutral' as const };
}

/** adminCompleteOrderPickup이 받는 상태. 숨김 매장은 자동 픽업 완료가 돌지 않아 관리자가 처리한다 */
export function canCompletePickup(status: OrderStatusType): boolean {
  return status === 'CONFIRMED' || status === 'MADE';
}
