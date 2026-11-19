import {
  type LucideIcon,
  BriefcaseIcon,
  InboxIcon,
  LayoutDashboardIcon,
  PackageIcon,
  TagsIcon,
  LayersIcon,
  ImageIcon,
  FlagIcon,
  BellIcon,
  MapPinIcon,
  ScrollTextIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  MessageSquareIcon,
  MessagesSquareIcon,
  ShoppingBagIcon,
  StoreIcon,
  UsersIcon,
  WalletIcon,
} from 'lucide-react';
import { type ComponentType } from 'react';

import { TaskCountBadge } from '@/features/tasks';

/** 사이드바 메뉴. 각 영역 PR이 자기 항목을 붙인다 — Link의 to가 라우트 타입으로 검사되므로 있는 경로만 둔다. */
interface NavItem {
  to:
    | '/'
    | '/tasks'
    | '/orders'
    | '/settlements'
    | '/users'
    | '/sellers'
    | '/stores'
    | '/products'
    | '/categories'
    | '/tags'
    | '/banners'
    | '/search-chips'
    | '/reports'
    | '/reviews'
    | '/review-comments'
    | '/notifications'
    | '/regions'
    | '/audit-logs'
    | '/admins'
    | '/settings';
  label: string;
  icon: LucideIcon;
  /** 메뉴 오른쪽 건수 배지 */
  badge?: ComponentType;
}
export interface NavGroup {
  label: string | null;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  { label: null, items: [{ to: '/', label: '대시보드', icon: LayoutDashboardIcon }] },
  {
    label: '운영',
    items: [
      { to: '/tasks', label: '처리 대기', icon: InboxIcon, badge: TaskCountBadge },
      { to: '/orders', label: '주문', icon: ShoppingBagIcon },
      { to: '/settlements', label: '정산', icon: WalletIcon },
      { to: '/reports', label: '신고', icon: FlagIcon },
      { to: '/reviews', label: '리뷰', icon: MessageSquareIcon },
      { to: '/review-comments', label: '리뷰 댓글', icon: MessagesSquareIcon },
      { to: '/notifications', label: '알림', icon: BellIcon },
    ],
  },
  {
    label: '계정',
    items: [
      { to: '/users', label: '구매자', icon: UsersIcon },
      { to: '/sellers', label: '판매자', icon: BriefcaseIcon },
      { to: '/admins', label: '관리자', icon: ShieldIcon },
    ],
  },
  {
    label: '카탈로그',
    items: [
      { to: '/stores', label: '매장', icon: StoreIcon },
      { to: '/products', label: '상품', icon: PackageIcon },
      { to: '/categories', label: '카테고리', icon: LayersIcon },
      { to: '/tags', label: '태그', icon: TagsIcon },
      { to: '/banners', label: '배너', icon: ImageIcon },
      { to: '/search-chips', label: '검색 칩', icon: SearchIcon },
      { to: '/regions', label: '지역', icon: MapPinIcon },
    ],
  },
  { label: '기록', items: [{ to: '/audit-logs', label: '감사 로그', icon: ScrollTextIcon }] },
  { label: '설정', items: [{ to: '/settings', label: '결제 설정', icon: SettingsIcon }] },
];

export function titleFor(pathname: string): string {
  for (const g of NAV_GROUPS) {
    for (const item of g.items) {
      if (item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)) return item.label;
    }
  }
  return '';
}
