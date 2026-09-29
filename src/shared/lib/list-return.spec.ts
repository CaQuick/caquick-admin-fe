import {
  Outlet,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';

import { forgetSearches, rememberSearch, rememberedSearch, trackListSearches } from './list-return';
import { parseSearch, stringifySearch } from './search-params';

function testRouter(initial: string) {
  const root = createRootRoute({ component: Outlet });
  const routes = ['/stores', '/stores/$id'].map((path) =>
    createRoute({ getParentRoute: () => root, path }),
  );
  return createRouter({
    routeTree: root.addChildren(routes),
    history: createMemoryHistory({ initialEntries: [initial] }),
    parseSearch,
    stringifySearch,
  });
}

describe('list-return', () => {
  afterEach(() => forgetSearches());

  it('경로별 마지막 검색 파라미터를 기억하고, 끝의 / 는 같은 경로로 본다', () => {
    rememberSearch('/stores', { q: '루미' });
    rememberSearch('/stores/', { q: '달빛' });
    expect(rememberedSearch('/stores')).toEqual({ q: '달빛' });
    expect(rememberedSearch('/stores/')).toEqual({ q: '달빛' });
    expect(rememberedSearch('/')).toBeUndefined();
    rememberSearch('/', {});
    expect(rememberedSearch('/')).toEqual({});
  });

  it('경로가 50개를 넘으면 가장 오래 안 본 것부터 버린다', () => {
    rememberSearch('/stores', { q: 'a' });
    for (let i = 0; i < 49; i += 1) rememberSearch(`/stores/${i}`, {});
    rememberSearch('/stores', { q: 'b' }); // 다시 보면 최근으로 옮긴다
    rememberSearch('/stores/49', {});
    expect(rememberedSearch('/stores')).toEqual({ q: 'b' });
    expect(rememberedSearch('/stores/0')).toBeUndefined();
    expect(rememberedSearch('/stores/1')).toEqual({});
  });

  it('비우면 기억한 것이 없다', () => {
    rememberSearch('/stores', { q: 'a' });
    forgetSearches();
    expect(rememberedSearch('/stores')).toBeUndefined();
  });

  it('라우터의 현재 위치와 이동을 기록하고, 해제하면 더 기록하지 않는다', async () => {
    const router = testRouter('/stores?q=%EB%A3%A8%EB%AF%B8');
    await router.load();
    const stop = trackListSearches(router);
    expect(rememberedSearch('/stores')).toEqual({ q: '루미' });

    router.history.push('/stores?active=false');
    await router.load();
    expect(rememberedSearch('/stores')).toEqual({ active: 'false' });

    stop();
    router.history.push('/stores?active=true');
    await router.load();
    expect(rememberedSearch('/stores')).toEqual({ active: 'false' });
  });
});
