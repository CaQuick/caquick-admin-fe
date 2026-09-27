import { Outlet, createFileRoute } from '@tanstack/react-router';

import { AppShell } from '@/app/shell/app-shell';

export const Route = createFileRoute('/_authed/_shell')({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
