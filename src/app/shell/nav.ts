import {
  type LucideIcon,
  LayoutDashboardIcon,
  ShoppingBagIcon,
  StoreIcon,
  UsersIcon,
} from 'lucide-react';

/** 사이드바 메뉴. 각 영역 PR이 자기 항목을 붙인다 — Link의 to가 라우트 타입으로 검사되므로 있는 경로만 둔다. */
interface NavItem {
  to: '/' | '/orders' | '/users' | '/sellers';
  label: string;
  icon: LucideIcon;
}
export interface NavGroup {
  label: string | null;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  { label: null, items: [{ to: '/', label: '대시보드', icon: LayoutDashboardIcon }] },
  { label: '운영', items: [{ to: '/orders', label: '주문', icon: ShoppingBagIcon }] },
  {
    label: '계정',
    items: [
      { to: '/users', label: '구매자', icon: UsersIcon },
      { to: '/sellers', label: '판매자', icon: StoreIcon },
    ],
  },
];

export function titleFor(pathname: string): string {
  for (const g of NAV_GROUPS) {
    for (const item of g.items) {
      if (item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)) return item.label;
    }
  }
  return '';
}
