import { createFileRoute } from '@tanstack/react-router';

import { OrdersListPage, ordersSearchSchema } from '@/features/orders';

export const Route = createFileRoute('/_authed/_shell/orders/')({
  validateSearch: ordersSearchSchema,
  component: OrdersRoute,
});

function OrdersRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <OrdersListPage search={search} onSearchChange={(next) => void navigate({ search: next })} />
  );
}
