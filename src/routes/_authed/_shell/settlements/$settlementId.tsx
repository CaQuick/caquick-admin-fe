import { createFileRoute } from '@tanstack/react-router';

import { SettlementDetailPage } from '@/features/settlements';

export const Route = createFileRoute('/_authed/_shell/settlements/$settlementId')({
  component: SettlementDetailRoute,
});

function SettlementDetailRoute() {
  const { settlementId } = Route.useParams();
  return <SettlementDetailPage settlementId={settlementId} />;
}
