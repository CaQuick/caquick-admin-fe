import { createFileRoute } from '@tanstack/react-router';

import { SellersListPage, sellersSearchSchema } from '@/features/sellers';

export const Route = createFileRoute('/_authed/_shell/sellers/')({
  validateSearch: sellersSearchSchema,
  component: SellersRoute,
});

function SellersRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <SellersListPage search={search} onSearchChange={(next) => void navigate({ search: next })} />
  );
}
