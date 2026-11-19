import { createFileRoute } from '@tanstack/react-router';

import { SettlementsTasksPage, settlementsSearchSchema } from '@/features/tasks';

export const Route = createFileRoute('/_authed/_shell/tasks/settlements')({
  validateSearch: settlementsSearchSchema,
  component: SettlementsRoute,
});

function SettlementsRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <SettlementsTasksPage
      search={search}
      onSearchChange={(next) => void navigate({ search: next })}
    />
  );
}
