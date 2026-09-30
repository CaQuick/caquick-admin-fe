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

import { BuyerRef } from './buyer-ref';

async function renderInRouter(ui: ReactNode) {
  const root = createRootRoute({ component: Outlet });
  const page = createRoute({ getParentRoute: () => root, path: '/', component: () => ui });
  const user = createRoute({ getParentRoute: () => root, path: '/users/$accountId' });
  const router = createRouter({
    routeTree: root.addChildren([page, user]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  render(<RouterProvider router={router} />);
  await screen.findByTestId('buyer');
}

describe('BuyerRef', () => {
  it.each([
    [
      '닉네임이 있으면 닉네임을 구매자 상세 링크로',
      '달콤이',
      undefined,
      true,
      '달콤이',
      true,
      false,
    ],
    ['글자를 넘기면 그 글자를 링크로', '달콤이', '7', true, '7', true, false],
    ['탈퇴(닉네임 null)면 #ID를 링크 없이 배지와', null, undefined, true, '#7', false, true],
    ['닉네임이 undefined여도 탈퇴로', undefined, undefined, true, '#7', false, true],
    ['탈퇴면 넘긴 글자도 링크 없이', null, '7', true, '7', false, true],
    ['탈퇴여도 배지를 끄면 글자만', null, '7', false, '7', false, false],
  ] as const)('%s 보인다', async (_case, nickname, children, badge, text, linked, pill) => {
    await renderInRouter(
      <span data-testid="buyer">
        <BuyerRef accountId="7" nickname={nickname} badge={badge}>
          {children}
        </BuyerRef>
      </span>,
    );
    expect(screen.getByText(text)).toBeInTheDocument();
    const link = screen.queryByRole('link');
    if (linked) expect(link).toHaveAttribute('href', '/users/7');
    else expect(link).toBeNull();
    expect(screen.queryByText('탈퇴 회원') !== null).toBe(pill);
  });

  it('탈퇴 글자는 링크 색을 쓰지 않는다', async () => {
    await renderInRouter(
      <span data-testid="buyer">
        <BuyerRef
          accountId="7"
          nickname={null}
          className="font-mono text-primary-soft-foreground"
        />
      </span>,
    );
    const text = screen.getByText('#7');
    expect(text).toHaveClass('font-mono', 'text-foreground');
    expect(text).not.toHaveClass('text-primary-soft-foreground');
  });
});
