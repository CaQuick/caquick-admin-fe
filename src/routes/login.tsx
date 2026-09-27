import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { LoginPage, ensureSession } from '@/features/auth';

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute('/login')({
  validateSearch: searchSchema,
  beforeLoad: async () => {
    if ((await ensureSession()) === 'authenticated') throw redirect({ to: '/', replace: true });
  },
  component: LoginRoute,
});

function LoginRoute() {
  const { redirect: next } = Route.useSearch();
  // 외부 URL로 튕기지 않게 같은 오리진의 경로만 받는다
  const safe = next?.startsWith('/') && !next.startsWith('//') ? next : undefined;
  return <LoginPage redirect={safe} />;
}
