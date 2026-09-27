import { createFileRoute } from '@tanstack/react-router';

import { RegionsPage, regionsSearchSchema } from '@/features/regions';

export const Route = createFileRoute('/_authed/_shell/regions')({
  validateSearch: regionsSearchSchema,
  component: RegionsRoute,
});

function RegionsRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <RegionsPage
      search={search}
      onSearchChange={(next) => void navigate({ search: next, replace: true })}
    />
  );
}
