import { createFileRoute } from '@tanstack/react-router';

import { UserDetailPage } from '@/features/accounts';

export const Route = createFileRoute('/_authed/_shell/users/$accountId')({
  component: UserDetailRoute,
});

function UserDetailRoute() {
  const { accountId } = Route.useParams();
  return <UserDetailPage accountId={accountId} />;
}
