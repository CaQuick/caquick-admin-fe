import { createFileRoute } from '@tanstack/react-router';

import { StoresListPage, storesSearchSchema } from '@/features/stores';

export const Route = createFileRoute('/_authed/_shell/stores/')({
  validateSearch: storesSearchSchema,
  component: StoresRoute,
});

function StoresRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <StoresListPage search={search} onSearchChange={(next) => void navigate({ search: next })} />
  );
}
