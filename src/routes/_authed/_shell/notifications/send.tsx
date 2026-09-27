import { createFileRoute } from '@tanstack/react-router';

import { SendNotificationPage } from '@/features/notifications';

export const Route = createFileRoute('/_authed/_shell/notifications/send')({
  component: SendNotificationPage,
});
