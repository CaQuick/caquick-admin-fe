import {
  type LucideIcon,
  BriefcaseIcon,
  LayoutDashboardIcon,
  PackageIcon,
  TagsIcon,
  LayersIcon,
  ImageIcon,
  FlagIcon,
  MessageSquareIcon,
  MessagesSquareIcon,
  ShoppingBagIcon,
  StoreIcon,
  UsersIcon,
} from 'lucide-react';

/** 사이드바 메뉴. 각 영역 PR이 자기 항목을 붙인다 — Link의 to가 라우트 타입으로 검사되므로 있는 경로만 둔다. */
interface NavItem {
  to:
    | '/'
    | '/orders'
    | '/users'
    | '/sellers'
    | '/stores'
    | '/products'
    | '/categories'
    | '/tags'
    | '/banners'
    | '/reports'
    | '/reviews'
    | '/review-comments';
  label: string;
  icon: LucideIcon;
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
      { to: '/orders', label: '주문', icon: ShoppingBagIcon },
      { to: '/reports', label: '신고', icon: FlagIcon },
      { to: '/reviews', label: '리뷰', icon: MessageSquareIcon },
      { to: '/review-comments', label: '리뷰 댓글', icon: MessagesSquareIcon },
    ],
  },
  {
    label: '계정',
    items: [
      { to: '/users', label: '구매자', icon: UsersIcon },
      { to: '/sellers', label: '판매자', icon: BriefcaseIcon },
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
