import { QueryClient } from '@tanstack/react-query';

/** 관리자 화면은 서버 진실 우선 — 짧은 staleTime, 창 포커스 재조회는 끈다(목록 필터 중 깜빡임 방지). */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: false },
      mutations: { retry: 0 },
    },
  });
}
