import { createFileRoute } from '@tanstack/react-router';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

export const Route = createFileRoute('/')({ component: Home });

function Home() {
  return (
    <main className="grid min-h-svh place-items-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <img src="/logo.png" alt="케이퀵" className="mx-auto mb-2 size-14 rounded-xl" />
          <CardTitle>케이퀵 어드민</CardTitle>
          <CardDescription>로그인·대시보드는 이어지는 PR에서 붙는다.</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-xs text-muted-foreground">
          admin.caquick.site
        </CardContent>
      </Card>
    </main>
  );
}
