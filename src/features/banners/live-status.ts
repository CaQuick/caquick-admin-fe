import { type BannerPlacement } from '@/graphql/generated/graphql';
import { type Timed, liveStatus } from '@/shared/lib/live-status';

interface SlotBanner extends Timed {
  id: string;
  placement: BannerPlacement;
  linkCategoryId?: string | null;
  linkTargetAvailable: boolean;
  sortOrder: number;
}

/** 구매자 앱이 한 배너를 뽑는 자리. 카테고리 배치는 카테고리마다 따로다. 소비자가 없는 배치는 null */
function slotKey(b: SlotBanner): string | null {
  switch (b.placement) {
    case 'HOME_MAIN':
    case 'SEARCH':
      return b.placement;
    case 'CATEGORY':
      return b.linkCategoryId ? `CATEGORY:${b.linkCategoryId}` : null;
    default:
      return null;
  }
}

const byId = (a: string, b: string) =>
  a.length !== b.length ? a.length - b.length : a < b ? -1 : a > b ? 1 : 0;

/**
 * 슬롯마다 지금 구매자에게 보이는 배너 1개의 ID. 노출 중인 것 가운데 정렬 순서가 가장 작고, 같으면 먼저 등록한(ID가 작은) 것.
 * 연결한 상품·매장·카테고리가 숨김이면(linkTargetAvailable=false) 구매자 앱처럼 건너뛰고 다음 배너를 고른다.
 */
export function currentBannerIds(banners: readonly SlotBanner[], now: Date): Set<string> {
  const winners = new Map<string, SlotBanner>();
  for (const b of banners) {
    const key = slotKey(b);
    if (key === null || !b.linkTargetAvailable || liveStatus(b, now) !== 'LIVE') continue;
    const cur = winners.get(key);
    if (
      !cur ||
      b.sortOrder < cur.sortOrder ||
      (b.sortOrder === cur.sortOrder && byId(b.id, cur.id) < 0)
    ) {
      winners.set(key, b);
    }
  }
  return new Set([...winners.values()].map((b) => b.id));
}
