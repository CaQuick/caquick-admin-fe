import { Link } from '@tanstack/react-router';

import { cn } from '@/shared/lib/utils';

import { NAV_GROUPS } from './nav';

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="주 메뉴" className="flex flex-col gap-0.5">
      {NAV_GROUPS.map((group, gi) => (
        <div key={group.label ?? gi} className="flex flex-col gap-0.5">
          {group.label && (
            <div className="px-2.5 pt-4 pb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              {group.label}
            </div>
          )}
          {group.items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              activeOptions={{ exact: item.to === '/' }}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13.5px] text-sidebar-foreground hover:bg-accent',
                'data-[status=active]:bg-sidebar-accent data-[status=active]:font-semibold data-[status=active]:text-sidebar-accent-foreground',
              )}
            >
              <item.icon className="size-4 shrink-0 opacity-70" aria-hidden />
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
