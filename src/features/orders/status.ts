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

/** 취소 가능 상태(BE: SUBMITTED·CONFIRMED·MADE) */
export function isCancelable(status: OrderStatusType): boolean {
  return status === 'SUBMITTED' || status === 'CONFIRMED' || status === 'MADE';
}
