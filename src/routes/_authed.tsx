import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { ensureSession, useAuthStore } from '@/features/auth';

/** 보호 구간. 세션이 없으면 로그인으로, 비밀번호 변경이 강제된 계정은 변경 화면 밖으로 못 나간다. */
export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    if ((await ensureSession()) !== 'authenticated') {
      throw redirect({ to: '/login', search: { redirect: location.href }, replace: true });
    }
    if (useAuthStore.getState().mustChangePassword && location.pathname !== '/change-password') {
      throw redirect({ to: '/change-password', replace: true });
    }
  },
  component: () => <Outlet />,
});
