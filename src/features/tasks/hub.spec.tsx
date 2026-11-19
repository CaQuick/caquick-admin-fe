import { QueryClient } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { HttpResponse, graphql } from 'msw';

import { App } from '@/app/app';
import { useAuthStore } from '@/features/auth';
import { forgetSearches } from '@/shared/lib/list-return';
import { gqlOk, restOk } from '@/test/msw/graphql';
import { server } from '@/test/msw/server';

import { TASK_POLL_MS, taskCountsQueryOptions } from './api/queries';

const me = {
  accountId: '1',
  username: 'ops.admin',
  email: null,
  name: null,
  status: 'ACTIVE',
  mustChangePassword: false,
  lastLoginAt: null,
  createdAt: '2026-09-27T00:00:00.000Z',
};
const counts = {
  claimedPayments: 2,
  pendingPayments: 5,
  refundsAwaitingAccount: 7,
  refundsAwaitingTransfer: 3,
  pendingSettlements: 1,
};

function boot(path: string) {
  server.use(
    restOk('/admin/refresh', {
      accessToken: 'at',
      tokenType: 'Bearer',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
    }),
    gqlOk('AdminMe', { adminMe: me }),
    gqlOk('AdminTaskCounts', { adminTaskCounts: counts }),
  );
  window.history.pushState({}, '', path);
  render(<App />);
}

describe('처리 대기 허브', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false });
    forgetSearches();
  });

  it('건수는 60초마다, 창에 돌아올 때마다 다시 읽는다', () => {
    const options = taskCountsQueryOptions();
    expect(TASK_POLL_MS).toBe(60_000);
    expect(options.refetchInterval).toBe(60_000);
    // 앱 기본값(포커스 재조회 끔)을 이 조회만 켠다
    expect(options.refetchOnWindowFocus).toBe(true);
    expect(new QueryClient().getQueryCache().find({ queryKey: options.queryKey })).toBeUndefined();
  });

  it('/tasks는 입금 탭으로 보내고, 사이드바 운영 맨 위에 처리 가능한 건수 합계를 단다', async () => {
    server.use(
      graphql.query('AdminTasksPendingPayments', () =>
        HttpResponse.json({
          data: {
            adminPendingPayments: { items: [], totalCount: 0, hasMore: false, nextCursor: null },
          },
        }),
      ),
    );
    boot('/tasks');
    await vi.waitFor(() => expect(window.location.pathname).toBe('/tasks/deposits'));
    expect(screen.getByRole('heading', { level: 1, name: '처리 대기' })).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: '주 메뉴' });
    const links = within(nav).getAllByRole('link');
    const tasks = await within(nav).findByRole('link', { name: '처리 대기 9건' });
    // 운영 묶음의 첫 메뉴(대시보드 다음)
    expect(links.indexOf(tasks)).toBe(1);
    expect(tasks).toHaveAttribute('data-status', 'active');

    const tabs = screen.getByRole('navigation', { name: '처리 대기 종류' });
    expect(within(tabs).getByRole('link', { name: '입금 5건' })).toHaveAttribute(
      'data-status',
      'active',
    );
    // 계좌 입력 대기(7)는 구매자를 기다리므로 탭 배지에 넣지 않는다
    expect(within(tabs).getByRole('link', { name: '환불 3건' })).toHaveAttribute(
      'href',
      '/tasks/refunds',
    );
    expect(within(tabs).getByRole('link', { name: '정산 송금 1건' })).toHaveAttribute(
      'href',
      '/tasks/settlements',
    );
    expect(await screen.findByText("'입금했어요'를 누른 주문이 없습니다.")).toBeInTheDocument();
  });

  it('처리할 건이 없으면 사이드바 배지를 달지 않는다', async () => {
    server.use(
      restOk('/admin/refresh', {
        accessToken: 'at',
        tokenType: 'Bearer',
        accountStatus: 'ACTIVE',
        mustChangePassword: false,
      }),
      gqlOk('AdminMe', { adminMe: me }),
    );
    window.history.pushState({}, '', '/audit-logs');
    server.use(
      gqlOk('AdminAuditLogs', {
        adminAuditLogs: { items: [], totalCount: 0, hasMore: false, nextCursor: null },
      }),
    );
    render(<App />);
    const nav = await screen.findByRole('navigation', { name: '주 메뉴' });
    expect(within(nav).getByRole('link', { name: '처리 대기' })).toHaveAttribute('href', '/tasks');
  });

  it('대시보드 타일은 같은 건수를 종류별 링크로 보인다', async () => {
    server.use(
      gqlOk('AdminDashboardSummary', {
        adminDashboardSummary: {
          from: 'x',
          to: 'y',
          orderAmountSum: 0,
          newUserCount: 0,
          newSellerCount: 0,
          activeStoreCount: 0,
          activeProductCount: 0,
          pendingReportCount: 0,
          orderCounts: { submitted: 0, confirmed: 0, made: 0, pickedUp: 0, canceled: 0 },
        },
      }),
      gqlOk('AdminSearchKeywordSnapshot', {
        adminSearchKeywordSnapshot: { rankedAt: '2026-09-27T08:00:00.000Z', items: [] },
      }),
    );
    boot('/');
    const tile = (await screen.findByText('처리 대기', { selector: 'div' })).closest<HTMLElement>(
      '[data-slot="card"]',
    )!;
    expect(await within(tile).findByText('9건')).toBeInTheDocument();
    expect(
      within(tile).getByRole('link', { name: '입금 확인 5건(입금했어요 2건)' }),
    ).toHaveAttribute('href', '/tasks/deposits');
    expect(
      within(tile).getByRole('link', { name: '환불 송금 3건 · 계좌 입력 대기 7건' }),
    ).toHaveAttribute('href', '/tasks/refunds');
    expect(within(tile).getByRole('link', { name: '정산 송금 1건' })).toHaveAttribute(
      'href',
      '/tasks/settlements',
    );
  });
});
