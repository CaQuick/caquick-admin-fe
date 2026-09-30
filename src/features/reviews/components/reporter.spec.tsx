import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';

import { Reporter } from './reporter';

async function renderInRouter(ui: ReactNode) {
  const root = createRootRoute({ component: Outlet });
  const page = createRoute({ getParentRoute: () => root, path: '/', component: () => ui });
  const user = createRoute({ getParentRoute: () => root, path: '/users/$accountId' });
  const router = createRouter({
    routeTree: root.addChildren([page, user]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  render(<RouterProvider router={router} />);
  await screen.findByTestId('reporter');
}

describe('Reporter', () => {
  it.each([
    ['활동 중이면 닉네임을 구매자 상세 링크로', '달콤이', false, '달콤이', true],
    ['닉네임 기록 전이면 #id 링크로', null, false, '#7', true],
    ['탈퇴했으면 신고 시점 닉네임을 링크 없이', '달콤이', true, '달콤이', false],
  ] as const)('%s 보인다', async (_case, nickname, withdrawn, text, linked) => {
    await renderInRouter(
      <span data-testid="reporter">
        <Reporter accountId="7" nickname={nickname} withdrawn={withdrawn} />
      </span>,
    );
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: text }) !== null).toBe(linked);
    expect(screen.queryByText('탈퇴 회원') !== null).toBe(withdrawn);
  });

  it('탈퇴했고 닉네임도 없으면 탈퇴 회원 배지만 보인다', async () => {
    await renderInRouter(
      <span data-testid="reporter">
        <Reporter accountId="7" nickname={null} withdrawn />
      </span>,
    );
    expect(screen.getByText('탈퇴 회원')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
