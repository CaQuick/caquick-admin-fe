import { createFileRoute } from '@tanstack/react-router';

import { NotificationHistoryPage, notificationsSearchSchema } from '@/features/notifications';

export const Route = createFileRoute('/_authed/_shell/notifications/')({
  validateSearch: notificationsSearchSchema,
  component: NotificationsRoute,
});

function NotificationsRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <NotificationHistoryPage
      search={search}
      onSearchChange={(next) => void navigate({ search: next })}
    />
  );
}
