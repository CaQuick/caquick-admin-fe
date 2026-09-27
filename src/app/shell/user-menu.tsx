import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { KeyRoundIcon, LogOutIcon } from 'lucide-react';

import { adminMeQueryOptions } from '@/features/account';
import { logout } from '@/features/auth';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

export function UserMenu({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const me = useQuery(adminMeQueryOptions());
  const name = me.data?.username ?? me.data?.name ?? '관리자';
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-2" aria-label="내 계정">
          <span className="grid size-7 place-items-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary-soft-foreground">
            {initials}
          </span>
          <span className="hidden text-sm sm:inline">{name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="text-sm font-medium">{name}</div>
          {me.data?.email && <div className="text-xs text-muted-foreground">{me.data.email}</div>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void navigate({ to: '/change-password' })}>
          <KeyRoundIcon className="size-4" /> 비밀번호 변경
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={async () => {
            await logout();
            onLogout();
          }}
        >
          <LogOutIcon className="size-4" /> 로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
