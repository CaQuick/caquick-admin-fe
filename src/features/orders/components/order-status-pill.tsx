import { type OrderStatusType } from '@/graphql/generated/graphql';
import { StatusPill } from '@/shared/ui/status-pill';

import { orderStatusMeta } from '../status';

export function OrderStatusPill({ status }: { status: OrderStatusType }) {
  const meta = orderStatusMeta(status);
  return <StatusPill tone={meta.tone}>{meta.label}</StatusPill>;
}
