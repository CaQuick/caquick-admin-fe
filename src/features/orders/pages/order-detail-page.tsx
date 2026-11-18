import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { HistoryIcon } from 'lucide-react';

import { messageFor } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';

import { orderDetailQueryOptions } from '../api/queries';
import { CancelOrderDialog } from '../components/cancel-order-dialog';
import { CompletePickupDialog } from '../components/complete-pickup-dialog';
import {
  OrderBuyer,
  OrderHistory,
  OrderItems,
  OrderPickupChanges,
  OrderProgress,
  OrderRequestNote,
} from '../components/order-detail-sections';
import {
  OrderCancellation,
  OrderPayment,
  OrderRefunds,
  OrderSettlement,
} from '../components/order-money-sections';
import { OrderStatusPill } from '../components/order-status-pill';
import { canCompletePickup } from '../status';

export function OrderDetailPage({ orderId }: { orderId: string }) {
  const q = useQuery(orderDetailQueryOptions(orderId));
  if (q.isError) {
    return (
      <>
        <PageHeader title="주문" back={{ to: '/orders' }} />
        <p role="alert" className="text-sm text-negative-foreground">
          {messageFor(q.error)}
        </p>
      </>
    );
  }
  if (!q.data) {
    return (
      <div className="flex flex-col gap-3" aria-busy>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  const order = q.data;
  return (
    <>
      <PageHeader
        back={{ to: '/orders' }}
        title={<span className="font-mono">{order.orderNumber}</span>}
        meta={<OrderStatusPill status={order.status} />}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/audit-logs" search={{ targetType: 'ORDER', targetId: order.id }}>
                <HistoryIcon className="size-4" /> 감사 이력
              </Link>
            </Button>
            {canCompletePickup(order.status) && (
              <CompletePickupDialog orderId={order.id} orderNumber={order.orderNumber} />
            )}
            {order.cancelOptions.cancelable && (
              <CancelOrderDialog
                orderId={order.id}
                orderNumber={order.orderNumber}
                options={order.cancelOptions}
              />
            )}
          </>
        }
      />
      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-3">
          <OrderProgress order={order} />
          <OrderItems order={order} />
          {order.requestNote !== null && <OrderRequestNote note={order.requestNote} />}
          <OrderPayment payment={order.payment} />
          {order.cancellation && <OrderCancellation cancellation={order.cancellation} />}
          {order.refunds.length > 0 && <OrderRefunds refunds={order.refunds} />}
          <OrderSettlement order={order} />
        </div>
        <div className="flex flex-col gap-3">
          <OrderBuyer order={order} />
          {order.pickupChanges.length > 0 && <OrderPickupChanges changes={order.pickupChanges} />}
          <OrderHistory order={order} />
        </div>
      </div>
    </>
  );
}
