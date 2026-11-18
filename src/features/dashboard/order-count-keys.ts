import { type OrderStatusType } from '@/graphql/generated/graphql';

import { type DashboardSummary } from './components/types';

type CountKey = keyof DashboardSummary['orderCounts'];

// 주문 건수 키는 이 표 한 곳에서 상태와 잇는다. Record라 조회 문서에 키를 더하면 tsc가 여기를 요구한다
const STATUS_BY_KEY: Record<CountKey, OrderStatusType> = {
  pendingPayment: 'PENDING_PAYMENT',
  submitted: 'SUBMITTED',
  confirmed: 'CONFIRMED',
  made: 'MADE',
  pickedUp: 'PICKED_UP',
  noShow: 'NO_SHOW',
  canceled: 'CANCELED',
};

/** 흐름 순서(차트 막대 순서) */
export const ORDER_COUNT_KEYS = (Object.keys(STATUS_BY_KEY) as CountKey[]).map((key) => ({
  key,
  status: STATUS_BY_KEY[key],
}));

export const orderCountTotal = (counts: DashboardSummary['orderCounts']) =>
  ORDER_COUNT_KEYS.reduce((sum, { key }) => sum + counts[key], 0);
