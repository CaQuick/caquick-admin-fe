import { createFileRoute } from '@tanstack/react-router';

import { UsersListPage, usersSearchSchema } from '@/features/accounts';

export const Route = createFileRoute('/_authed/_shell/users/')({
  validateSearch: usersSearchSchema,
  component: UsersRoute,
});

function UsersRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <UsersListPage search={search} onSearchChange={(next) => void navigate({ search: next })} />
  );
}
