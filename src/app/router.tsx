import { type QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';

import { routeTree } from '@/routeTree.gen';
import { parseSearch, stringifySearch } from '@/shared/lib/search-params';

export interface RouterContext {
  queryClient: QueryClient;
}

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    scrollRestoration: true,
    // 기본 JSON 직렬화는 문자열 'true'·'17'을 따옴표로 감싼다(?deleted=%22true%22). 타입은 라우트 zod 스키마가 정한다
    parseSearch,
    stringifySearch,
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
