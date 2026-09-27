import { createFileRoute } from '@tanstack/react-router';

import { OrderDetailPage } from '@/features/orders';

export const Route = createFileRoute('/_authed/_shell/orders/$orderId')({
  component: OrderDetailRoute,
});

function OrderDetailRoute() {
  const { orderId } = Route.useParams();
  return <OrderDetailPage orderId={orderId} />;
}
