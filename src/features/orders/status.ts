import { type OrderStatusType } from '@/graphql/generated/graphql';
import { type PillTone } from '@/shared/ui/status-pill';

export const ORDER_STATUS: { value: OrderStatusType; label: string; tone: PillTone }[] = [
  { value: 'SUBMITTED', label: '접수', tone: 'primary' },
  { value: 'CONFIRMED', label: '주문 확정', tone: 'caution' },
  { value: 'MADE', label: '제작 완료', tone: 'neutral' },
  { value: 'PICKED_UP', label: '픽업 완료', tone: 'positive' },
  { value: 'CANCELED', label: '취소', tone: 'negative' },
];

export const ORDER_STATUS_VALUES = ORDER_STATUS.map((s) => s.value) as [
  OrderStatusType,
  ...OrderStatusType[],
];

export function orderStatusMeta(value: OrderStatusType) {
  return (
    ORDER_STATUS.find((s) => s.value === value) ?? { value, label: value, tone: 'neutral' as const }
  );
}

/** 사정(fault) 선택 없이 취소할 수 있는 상태. 확정·제작 완료는 BE가 사정을 요구한다 */
export function isCancelable(status: OrderStatusType): boolean {
  return status === 'PENDING_PAYMENT' || status === 'SUBMITTED';
}
