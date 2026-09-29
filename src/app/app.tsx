import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { createQueryClient } from '@/app/query-client';
import { createAppRouter } from '@/app/router';
import { installSessionHooks, useAuthStore } from '@/features/auth';
import { initTheme } from '@/shared/theme';
import { Toaster } from '@/shared/ui/sonner';

/** 로그인·비밀번호 변경 화면은 세션을 비운 뒤 스스로 이동한다. */
const SELF_HANDLED_PATHS = new Set(['/login', '/change-password']);

export function App() {
  const [queryClient] = useState(createQueryClient);
  const [router] = useState(() => createAppRouter(queryClient));
  useState(() => {
    initTheme();
    installSessionHooks();
    return null;
  });

  // 세션을 잃으면(refresh 실패·로그아웃) 다음 내비게이션을 기다리지 않고 로그인으로 보낸다
  useEffect(
    () =>
      useAuthStore.subscribe((state, prev) => {
        if (prev.status !== 'authenticated' || state.status !== 'anonymous') return;
        const { pathname, href } = router.state.location;
        if (SELF_HANDLED_PATHS.has(pathname)) return;
        queryClient.clear();
        void router.navigate({ to: '/login', search: { redirect: href }, replace: true });
      }),
    [router, queryClient],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}
