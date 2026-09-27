import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { AdminsPage } from '@/features/account';
import { listSearchBase } from '@/shared/lib/list-search';

export const Route = createFileRoute('/_authed/_shell/admins')({
  validateSearch: z.object({ cursor: listSearchBase.cursor }),
  component: AdminsRoute,
});

function AdminsRoute() {
  const { cursor } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <AdminsPage cursor={cursor} onCursor={(next) => void navigate({ search: { cursor: next } })} />
  );
}
