import { type AnyRouter } from '@tanstack/react-router';

/** 경로별로 마지막에 본 검색 파라미터. 상세에서 '목록으로' 돌아갈 때 필터·페이지를 되살린다 */
const lastSearch = new Map<string, Record<string, unknown>>();
const MAX_PATHS = 50;

const normalize = (pathname: string) =>
  pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

/** CursorPager가 지나온 커서. 목록으로 돌아와 다시 마운트돼도 '이전'과 구간 표시를 되살린다 */
export interface CursorTrail {
  /** 커서를 뺀 목록 조건 */
  filterKey: string;
  /** 지나온 커서 순서. undefined는 첫 페이지 */
  cursors: (string | undefined)[];
}
const lastTrail = new Map<string, CursorTrail>();

function remember<T>(map: Map<string, T>, pathname: string, value: T) {
  const key = normalize(pathname);
  map.delete(key);
  map.set(key, value);
  // 상세 경로는 ID마다 쌓이므로 오래된 것부터 버린다
  if (map.size > MAX_PATHS) map.delete(map.keys().next().value!);
}

export function rememberSearch(pathname: string, search: Record<string, unknown>) {
  remember(lastSearch, pathname, search);
}

export function rememberedSearch(pathname: string): Record<string, unknown> | undefined {
  return lastSearch.get(normalize(pathname));
}

export function rememberTrail(pathname: string, trail: CursorTrail) {
  remember(lastTrail, pathname, trail);
}

export function rememberedTrail(pathname: string): CursorTrail | undefined {
  return lastTrail.get(normalize(pathname));
}

/** 세션을 잃으면 기억한 검색 파라미터·커서를 모두 비운다 */
export function forgetSearches() {
  lastSearch.clear();
  lastTrail.clear();
}

/** 라우터 이동이 끝날 때마다 위치를 기록한다. 반환값은 구독 해제 함수. */
export function trackListSearches(router: AnyRouter): () => void {
  const { location } = router.state;
  rememberSearch(location.pathname, location.search as Record<string, unknown>);
  return router.subscribe('onResolved', ({ toLocation }) =>
    rememberSearch(toLocation.pathname, toLocation.search as Record<string, unknown>),
  );
}
