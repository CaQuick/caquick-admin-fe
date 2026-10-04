import { type PillTone } from '@/shared/ui/status-pill';

/** 노출 여부 + 기간으로 정하는 구매자 노출 상태(배너·검색 칩 공통) */
export type LiveStatus = 'LIVE' | 'SCHEDULED' | 'ENDED' | 'HIDDEN';

export const LIVE_STATUS: Record<LiveStatus, { label: string; tone: PillTone }> = {
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
export function liveStatus(b: Timed, now: Date): LiveStatus {
  if (!b.isActive) return 'HIDDEN';
  const t = now.getTime();
  if (b.startsAt && new Date(b.startsAt).getTime() > t) return 'SCHEDULED';
  if (b.endsAt && new Date(b.endsAt).getTime() <= t) return 'ENDED';
  return 'LIVE';
}

/** 노출 상태가 바뀌는 다음 시각(ms). 지금 이후의 시작·종료 시각 가운데 가장 이른 것, 없으면 null. 숨김은 시각으로 바뀌지 않는다 */
export function nextLiveBoundary(items: readonly Timed[], now: Date): number | null {
  const t = now.getTime();
  let next: number | null = null;
  for (const b of items) {
    if (!b.isActive) continue;
    for (const at of [b.startsAt, b.endsAt]) {
      if (!at) continue;
      const ms = new Date(at).getTime();
      if (ms > t && (next === null || ms < next)) next = ms;
    }
  }
  return next;
}
