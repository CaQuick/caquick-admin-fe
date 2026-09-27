import { type ReactNode } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

interface Props {
  title: string;
  description: string;
  children: ReactNode;
}

/** 로그인·비밀번호 변경처럼 셸 밖에서 단독으로 뜨는 화면의 틀. */
export function AuthCard({ title, description, children }: Props) {
  return (
    <main className="grid min-h-svh place-items-center bg-background px-4 py-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-3 flex items-center gap-2.5">
            <img src="/logo.png" alt="" className="size-8 rounded-lg" />
            <div className="leading-tight">
              <div className="text-sm font-semibold">케이퀵 어드민</div>
              <div className="text-[11px] text-muted-foreground">CaQuick Admin</div>
            </div>
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  );
}
