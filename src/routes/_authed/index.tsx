import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { logout } from '@/features/auth';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

export const Route = createFileRoute('/_authed/')({ component: Home });

function Home() {
  const navigate = useNavigate();
  const { queryClient } = Route.useRouteContext();
  return (
    <main className="grid min-h-svh place-items-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <img src="/logo.png" alt="케이퀵" className="mx-auto mb-2 size-14 rounded-xl" />
          <CardTitle>케이퀵 어드민</CardTitle>
          <CardDescription>대시보드와 셸은 이어지는 PR에서 붙는다.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button
            variant="outline"
            onClick={async () => {
              await logout();
              queryClient.clear();
              await navigate({ to: '/login', replace: true });
            }}
          >
            로그아웃
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
