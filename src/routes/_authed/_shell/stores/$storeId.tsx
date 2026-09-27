import { createFileRoute } from '@tanstack/react-router';

import { StoreDetailPage } from '@/features/stores';

export const Route = createFileRoute('/_authed/_shell/stores/$storeId')({
  component: StoreDetailRoute,
});

function StoreDetailRoute() {
  const { storeId } = Route.useParams();
  return <StoreDetailPage storeId={storeId} />;
}
