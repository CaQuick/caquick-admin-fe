import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';

import { type RouterContext } from '@/app/router';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
  notFoundComponent: () => (
    <main className="grid min-h-svh place-items-center px-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">404</p>
        <h1 className="mt-1 text-lg font-semibold">페이지를 찾을 수 없습니다</h1>
      </div>
    </main>
  ),
});
