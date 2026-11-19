import { createFileRoute } from '@tanstack/react-router';

import { RefundsTasksPage, refundsSearchSchema } from '@/features/tasks';

export const Route = createFileRoute('/_authed/_shell/tasks/refunds')({
  validateSearch: refundsSearchSchema,
  component: RefundsRoute,
});

function RefundsRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <RefundsTasksPage search={search} onSearchChange={(next) => void navigate({ search: next })} />
  );
}
