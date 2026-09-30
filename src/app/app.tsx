import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { createQueryClient } from '@/app/query-client';
import { createAppRouter } from '@/app/router';
import { installSessionHooks, useAuthStore } from '@/features/auth';
import { forgetSearches, trackListSearches } from '@/shared/lib/list-return';
import { initTheme } from '@/shared/theme';
import { Toaster } from '@/shared/ui/sonner';

/** 로그인·비밀번호 변경 화면은 세션을 비운 뒤 스스로 이동한다(캐시 비우기는 앱이 항상 한다). */
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
        // 어느 화면에서든 비운다 — 다음에 로그인한 계정이 이전 관리자의 캐시·목록 필터를 보지 않게
        queryClient.clear();
        forgetSearches();
        const { pathname, href } = router.state.location;
        if (SELF_HANDLED_PATHS.has(pathname)) return;
        void router.navigate({ to: '/login', search: { redirect: href }, replace: true });
      }),
    [router, queryClient],
  );

  // 상세의 '목록으로'가 마지막에 본 필터·페이지로 돌아가게 위치를 기록한다
  useEffect(() => trackListSearches(router), [router]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {/* 저장 버튼이 대부분 오른쪽 아래라 가리지 않게 위 가운데에 띄운다 */}
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
