import { type AnyRouter } from '@tanstack/react-router';

/** 경로별로 마지막에 본 검색 파라미터. 상세에서 '목록으로' 돌아갈 때 필터·페이지를 되살린다 */
const lastSearch = new Map<string, Record<string, unknown>>();
const MAX_PATHS = 50;

const normalize = (pathname: string) =>
  pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

export function rememberSearch(pathname: string, search: Record<string, unknown>) {
  const key = normalize(pathname);
  lastSearch.delete(key);
  lastSearch.set(key, search);
  // 상세 경로는 ID마다 쌓이므로 오래된 것부터 버린다
  if (lastSearch.size > MAX_PATHS) lastSearch.delete(lastSearch.keys().next().value!);
}

export function rememberedSearch(pathname: string): Record<string, unknown> | undefined {
  return lastSearch.get(normalize(pathname));
}

export function forgetSearches() {
  lastSearch.clear();
}

/** 라우터 이동이 끝날 때마다 위치를 기록한다. 반환값은 구독 해제 함수. */
export function trackListSearches(router: AnyRouter): () => void {
  const { location } = router.state;
  rememberSearch(location.pathname, location.search as Record<string, unknown>);
  return router.subscribe('onResolved', ({ toLocation }) =>
    rememberSearch(toLocation.pathname, toLocation.search as Record<string, unknown>),
  );
}
