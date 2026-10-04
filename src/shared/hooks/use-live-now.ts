import { useEffect, useState } from 'react';

import { type Timed, nextLiveBoundary } from '@/shared/lib/live-status';

/** setTimeout이 받는 최대 지연(약 24.8일). 넘기면 곧바로 불려 계속 다시 그리게 된다 */
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/**
 * 노출 상태 계산에 쓰는 '지금'. 가장 가까운 시작·종료 시각에 다시 잡아, 화면을 켜 둔 채
 * 예약이 노출 중으로, 노출 중이 종료로 바뀌게 한다
 */
export function useLiveNow(items: readonly Timed[]): Date {
  const [now, setNow] = useState(() => new Date());
  const next = nextLiveBoundary(items, now);
  const nowMs = now.getTime();
  useEffect(() => {
    if (next === null) return;
    // 새로 받은 목록의 경계가 이미 지났으면 곧바로 다시 잡는다
    const delay = Math.min(Math.max(next - Date.now(), 0), MAX_TIMEOUT_MS);
    const timer = setTimeout(() => setNow(new Date()), delay);
    return () => clearTimeout(timer);
  }, [next, nowMs]);
  return now;
}
