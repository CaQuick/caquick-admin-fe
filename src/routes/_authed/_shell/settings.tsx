import { createFileRoute } from '@tanstack/react-router';

import { PaymentSettingsPage } from '@/features/settlements';

export const Route = createFileRoute('/_authed/_shell/settings')({
  component: PaymentSettingsPage,
});
