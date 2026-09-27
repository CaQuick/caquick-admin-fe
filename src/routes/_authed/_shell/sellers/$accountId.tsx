import { createFileRoute } from '@tanstack/react-router';

import { SellerDetailPage } from '@/features/sellers';

export const Route = createFileRoute('/_authed/_shell/sellers/$accountId')({
  component: SellerDetailRoute,
});

function SellerDetailRoute() {
  const { accountId } = Route.useParams();
  return <SellerDetailPage accountId={accountId} />;
}
