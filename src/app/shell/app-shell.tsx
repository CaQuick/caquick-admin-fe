import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { MenuIcon } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { Button } from '@/shared/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/shared/ui/sheet';

import { titleFor } from './nav';
import { SidebarNav } from './sidebar-nav';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-2 py-1">
      <img src="/logo.png" alt="" className="size-7 rounded-lg" />
      <div className="leading-tight">
        <div className="text-[15px] font-bold">케이퀵 어드민</div>
        <div className="text-[11px] text-muted-foreground">admin.caquick.site</div>
      </div>
    </div>
  );
}

/** 보호 구간의 공통 틀: 좌측 사이드바(모바일은 시트) + 상단 바 + 본문. */
export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const title = titleFor(pathname);

  const onLogout = () => {
    queryClient.clear();
    void navigate({ to: '/login', replace: true });
  };

  return (
    <div className="grid min-h-svh md:grid-cols-[232px_1fr]">
      <aside className="hidden flex-col gap-4 border-r border-sidebar-border bg-sidebar px-3 py-4 md:flex">
        <Brand />
        <SidebarNav />
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur md:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="메뉴 열기">
                <MenuIcon className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 px-3 py-4">
              <SheetTitle className="sr-only">메뉴</SheetTitle>
              <Brand />
              <div className="mt-4">
                <SidebarNav onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="truncate text-[15px] font-semibold">{title}</h1>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu onLogout={onLogout} />
          </div>
        </header>
        <main className="flex-1 px-4 py-5 md:px-6">{children}</main>
      </div>
    </div>
  );
}
