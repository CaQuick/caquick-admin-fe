import { createFileRoute } from '@tanstack/react-router';

import { DashboardPage, periodSearchSchema, resolvePeriod } from '@/features/dashboard';

export const Route = createFileRoute('/_authed/_shell/')({
  validateSearch: periodSearchSchema,
  component: DashboardRoute,
});

function DashboardRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const period = resolvePeriod(search);
  return (
    <DashboardPage
      period={period}
      onPeriodChange={(next) => void navigate({ search: next, replace: true })}
    />
  );
}
