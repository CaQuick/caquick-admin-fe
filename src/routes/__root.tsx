import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';

import { type RouterContext } from '@/app/router';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
  errorComponent: ({ error, reset }) => (
    <main className="grid min-h-svh place-items-center px-4">
      <div className="max-w-md text-center">
        <p className="text-sm text-muted-foreground">오류</p>
        <h1 className="mt-1 text-lg font-semibold">화면을 표시하지 못했습니다</h1>
        <p className="mt-2 text-sm break-words text-muted-foreground">
          {error instanceof Error ? error.message : String(error)}
        </p>
        <button
          type="button"
          className="mt-4 text-sm text-primary underline underline-offset-4"
          onClick={reset}
        >
          다시 시도
        </button>
      </div>
    </main>
  ),
  notFoundComponent: () => (
    <main className="grid min-h-svh place-items-center px-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">404</p>
        <h1 className="mt-1 text-lg font-semibold">페이지를 찾을 수 없습니다</h1>
      </div>
    </main>
  ),
});
