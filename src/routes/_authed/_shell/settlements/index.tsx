import { createFileRoute } from '@tanstack/react-router';

import { SettlementsListPage, settlementsSearchSchema } from '@/features/settlements';

export const Route = createFileRoute('/_authed/_shell/settlements/')({
  validateSearch: settlementsSearchSchema,
  component: SettlementsRoute,
});

function SettlementsRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <SettlementsListPage
      search={search}
      onSearchChange={(next) => void navigate({ search: next })}
    />
  );
}
