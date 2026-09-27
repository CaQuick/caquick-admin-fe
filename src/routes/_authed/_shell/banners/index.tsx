import { createFileRoute } from '@tanstack/react-router';

import { BannersListPage, bannersSearchSchema } from '@/features/banners';

export const Route = createFileRoute('/_authed/_shell/banners/')({
  validateSearch: bannersSearchSchema,
  component: BannersRoute,
});

function BannersRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <BannersListPage search={search} onSearchChange={(next) => void navigate({ search: next })} />
  );
}
