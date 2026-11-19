import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { act, render, screen, within } from '@testing-library/react';
import { HttpResponse, graphql } from 'msw';

import { App } from '@/app/app';
import { createQueryClient } from '@/app/query-client';
import { useAuthStore } from '@/features/auth';
import { forgetSearches } from '@/shared/lib/list-return';
import { gqlOk, restOk } from '@/test/msw/graphql';
import { server } from '@/test/msw/server';

import {
  refundQueryOptions,
  settlementQueryOptions,
  taskCountsQueryOptions,
  taskOrderQueryOptions,
} from './api/queries';

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
const noCounts = {
  claimedPayments: 0,
  pendingPayments: 0,
  refundsAwaitingAccount: 0,
  refundsAwaitingTransfer: 0,
  pendingSettlements: 0,
};
const noPayments = gqlOk('AdminTasksPendingPayments', {
  adminPendingPayments: { items: [], totalCount: 0, hasMore: false, nextCursor: null },
});

function boot(path: string, taskCounts = counts) {
  server.use(
    restOk('/admin/refresh', {
      accessToken: 'at',
      tokenType: 'Bearer',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
    }),
    gqlOk('AdminMe', { adminMe: me }),
    gqlOk('AdminTaskCounts', { adminTaskCounts: taskCounts }),
  );
  window.history.pushState({}, '', path);
  render(<App />);
}

describe('처리 대기 허브', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false });
    forgetSearches();
  });

  it('건수는 60초마다, 창에 돌아올 때마다 다시 읽는다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      let reads = 0;
      server.use(
        graphql.query('AdminTaskCounts', () => {
          reads += 1;
          return HttpResponse.json({ data: { adminTaskCounts: counts } });
        }),
      );
      function Counts() {
        useQuery(taskCountsQueryOptions());
        return null;
      }
      // 앱 기본값(포커스 재조회 끔·staleTime 15초) 위에서 본다
      render(
        <QueryClientProvider client={createQueryClient()}>
          <Counts />
        </QueryClientProvider>,
      );
      await vi.waitFor(() => expect(reads).toBe(1));
      act(() => {
        vi.advanceTimersByTime(60_000);
      });
      await vi.waitFor(() => expect(reads).toBe(2));

      act(() => {
        vi.advanceTimersByTime(20_000);
        window.dispatchEvent(new Event('visibilitychange'));
      });
      await vi.waitFor(() => expect(reads).toBe(3));
    } finally {
      vi.useRealTimers();
    }
  });

  it('열린 시트의 상세(주문·환불·정산)도 60초마다 다시 읽는다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const reads = { order: 0, refund: 0, settlement: 0 };
      server.use(
        graphql.query('AdminTasksOrder', () => {
          reads.order += 1;
          return HttpResponse.json({ data: { adminOrder: null } });
        }),
        graphql.query('AdminTasksRefund', () => {
          reads.refund += 1;
          return HttpResponse.json({ data: { adminRefund: null } });
        }),
        graphql.query('AdminTasksSettlement', () => {
          reads.settlement += 1;
          return HttpResponse.json({ data: { adminSettlement: null } });
        }),
      );
      function Details() {
        useQuery(taskOrderQueryOptions('1'));
        useQuery(refundQueryOptions('2'));
        useQuery(settlementQueryOptions('3'));
        return null;
      }
      render(
        <QueryClientProvider client={createQueryClient()}>
          <Details />
        </QueryClientProvider>,
      );
      await vi.waitFor(() => expect(reads).toEqual({ order: 1, refund: 1, settlement: 1 }));
      act(() => {
        vi.advanceTimersByTime(60_000);
      });
      await vi.waitFor(() => expect(reads).toEqual({ order: 2, refund: 2, settlement: 2 }));
    } finally {
      vi.useRealTimers();
    }
  });

  it('/tasks는 입금 탭으로 보내고, 사이드바 운영 맨 위에 처리 가능한 건수 합계를 단다', async () => {
    server.use(noPayments);
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

  it('처리할 건이 없으면 사이드바·탭 배지를 달지 않는다', async () => {
    server.use(noPayments);
    boot('/tasks/deposits', noCounts);
    // 보기 탭은 0도 그리므로, 이게 보이면 건수를 받은 뒤다
    await screen.findByRole('tab', { name: '확인 요청 0' });
    const nav = screen.getByRole('navigation', { name: '주 메뉴' });
    expect(within(nav).getByRole('link', { name: '처리 대기' })).toHaveAttribute('href', '/tasks');
    const tabs = screen.getByRole('navigation', { name: '처리 대기 종류' });
    expect(
      within(tabs)
        .getAllByRole('link')
        .map((l) => l.textContent),
    ).toEqual(['입금', '환불', '정산 송금']);
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
          orderCounts: {
            pendingPayment: 0,
            submitted: 0,
            confirmed: 0,
            made: 0,
            pickedUp: 0,
            noShow: 0,
            canceled: 0,
          },
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
