import { createFileRoute } from '@tanstack/react-router';

import { DepositsTasksPage, depositsSearchSchema } from '@/features/tasks';

export const Route = createFileRoute('/_authed/_shell/tasks/deposits')({
  validateSearch: depositsSearchSchema,
  component: DepositsRoute,
});

function DepositsRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <DepositsTasksPage search={search} onSearchChange={(next) => void navigate({ search: next })} />
  );
}
