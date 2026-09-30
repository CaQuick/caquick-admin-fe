import { type BannerPlacement } from '@/graphql/generated/graphql';
import { type PillTone } from '@/shared/ui/status-pill';

export type BannerLiveStatus = 'LIVE' | 'SCHEDULED' | 'ENDED' | 'HIDDEN';

export const LIVE_STATUS: Record<BannerLiveStatus, { label: string; tone: PillTone }> = {
  LIVE: { label: '노출 중', tone: 'positive' },
  SCHEDULED: { label: '예약', tone: 'primary' },
  ENDED: { label: '종료', tone: 'neutral' },
  HIDDEN: { label: '숨김', tone: 'neutral' },
};

export interface Timed {
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

/** 구매자 조회와 같은 경계: 시작 시각 포함, 종료 시각 제외 */
export function bannerLiveStatus(b: Timed, now: Date): BannerLiveStatus {
  if (!b.isActive) return 'HIDDEN';
  const t = now.getTime();
  if (b.startsAt && new Date(b.startsAt).getTime() > t) return 'SCHEDULED';
  if (b.endsAt && new Date(b.endsAt).getTime() <= t) return 'ENDED';
  return 'LIVE';
}

interface SlotBanner extends Timed {
  id: string;
  placement: BannerPlacement;
  linkCategoryId?: string | null;
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
 * 연결한 상품·매장·카테고리가 숨김이면 구매자 앱은 다음 배너로 넘어가는데, 이 목록은 그 상태를 모른다.
 */
export function currentBannerIds(banners: readonly SlotBanner[], now: Date): Set<string> {
  const winners = new Map<string, SlotBanner>();
  for (const b of banners) {
    const key = slotKey(b);
    if (key === null || bannerLiveStatus(b, now) !== 'LIVE') continue;
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

/** 노출 상태가 바뀌는 다음 시각(ms). 지금 이후의 시작·종료 시각 가운데 가장 이른 것, 없으면 null. 숨김은 시각으로 바뀌지 않는다 */
export function nextLiveBoundary(banners: readonly Timed[], now: Date): number | null {
  const t = now.getTime();
  let next: number | null = null;
  for (const b of banners) {
    if (!b.isActive) continue;
    for (const at of [b.startsAt, b.endsAt]) {
      if (!at) continue;
      const ms = new Date(at).getTime();
      if (ms > t && (next === null || ms < next)) next = ms;
    }
  }
  return next;
}
