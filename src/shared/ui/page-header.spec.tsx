import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { forgetSearches, trackListSearches } from '@/shared/lib/list-return';
import { parseSearch, stringifySearch } from '@/shared/lib/search-params';

import { PageHeader } from './page-header';

function renderAt(initial: string) {
  const root = createRootRoute({ component: Outlet });
  const list = createRoute({
    getParentRoute: () => root,
    path: '/stores',
    component: () => <p>매장 목록</p>,
  });
  const detail = createRoute({
    getParentRoute: () => root,
    path: '/stores/$id',
    component: () => <PageHeader title="루미 케이크" back={{ to: '/stores' }} />,
  });
  const router = createRouter({
    routeTree: root.addChildren([list, detail]),
    history: createMemoryHistory({ initialEntries: [initial] }),
    parseSearch,
    stringifySearch,
  });
  const stop = trackListSearches(router);
  render(<RouterProvider router={router} />);
  return { router, stop };
}

describe('PageHeader back', () => {
  afterEach(() => forgetSearches());

  it('목록을 거쳐 왔으면 그때의 필터·페이지로 돌아가는 링크를 둔다', async () => {
    const { router, stop } = renderAt('/stores?q=%EB%A3%A8%EB%AF%B8&active=false&cursor=2');
    await screen.findByText('매장 목록');
    router.history.push('/stores/17');
    const link = await screen.findByRole('link', { name: '목록으로' });
    expect(link).toHaveAttribute('href', '/stores?q=%EB%A3%A8%EB%AF%B8&active=false&cursor=2');

    await userEvent.click(link);
    await screen.findByText('매장 목록');
    expect(router.state.location.search).toEqual({ q: '루미', active: 'false', cursor: '2' });
    stop();
  });

  it('상세로 바로 들어왔으면 필터 없는 목록으로 간다', async () => {
    const { stop } = renderAt('/stores/17');
    expect(await screen.findByRole('link', { name: '목록으로' })).toHaveAttribute(
      'href',
      '/stores',
    );
    stop();
  });

  it('라벨을 바꿀 수 있다', () => {
    const root = createRootRoute({
      component: () => <PageHeader title="배너" back={{ to: '/banners', label: '배너 목록' }} />,
    });
    const router = createRouter({
      routeTree: root,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    render(<RouterProvider router={router} />);
    return expect(screen.findByRole('link', { name: '배너 목록' })).resolves.toBeInTheDocument();
  });

  it('back이 없으면 링크를 두지 않는다', () => {
    const root = createRootRoute({ component: () => <PageHeader title="매장" /> });
    const router = createRouter({
      routeTree: root,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    render(<RouterProvider router={router} />);
    return screen.findByRole('heading', { name: '매장' }).then(() => {
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });
});
