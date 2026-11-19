import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authed/_shell/tasks/')({
  beforeLoad: () => {
    throw redirect({ to: '/tasks/deposits', replace: true });
  },
});
