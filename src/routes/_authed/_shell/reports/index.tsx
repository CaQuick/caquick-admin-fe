import { createFileRoute } from '@tanstack/react-router';

import { ReportsPage, reportsSearchSchema } from '@/features/reviews';

export const Route = createFileRoute('/_authed/_shell/reports/')({
  validateSearch: reportsSearchSchema,
  component: ReportsRoute,
});

function ReportsRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return <ReportsPage search={search} onSearchChange={(next) => void navigate({ search: next })} />;
}
