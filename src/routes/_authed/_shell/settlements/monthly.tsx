import { createFileRoute } from '@tanstack/react-router';

import { MonthlyCommissionsPage, monthlySearchSchema } from '@/features/settlements';

export const Route = createFileRoute('/_authed/_shell/settlements/monthly')({
  validateSearch: monthlySearchSchema,
  component: MonthlyRoute,
});

function MonthlyRoute() {
  const { month } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <MonthlyCommissionsPage
      month={month}
      onMonthChange={(next) => void navigate({ search: { month: next } })}
    />
  );
}
