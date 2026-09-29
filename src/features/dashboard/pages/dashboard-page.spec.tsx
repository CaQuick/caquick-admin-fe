import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, graphql } from 'msw';

import { App } from '@/app/app';
import { useAuthStore } from '@/features/auth';
import { gqlError, gqlOk, restOk } from '@/test/msw/graphql';
import { server } from '@/test/msw/server';

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
const summary = {
  from: 'x',
  to: 'y',
  newUserCount: 128,
  newSellerCount: 3,
  orderCounts: { submitted: 21, confirmed: 34, made: 18, pickedUp: 78, canceled: 12 },
  orderAmountSum: 4812000,
  activeStoreCount: 42,
  activeProductCount: 517,
  pendingReportCount: 7,
};
const snapshot = {
  rankedAt: '2026-09-27T08:00:00.000Z',
  items: [
    { rank: 1, keyword: '생일 케이크', searchCount: 1204 },
    { rank: 2, keyword: '레터링', searchCount: 988 },
  ],
};

function boot(path = '/') {
  server.use(
    restOk('/admin/refresh', {
      accessToken: 'at',
      tokenType: 'Bearer',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
    }),
    gqlOk('AdminMe', { adminMe: me }),
  );
  window.history.pushState({}, '', path);
  render(<App />);
}

describe('DashboardPage', () => {
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );

  it('KPI·상태 분포·검색어 순위를 보여주고 기간은 KST 경계로 보낸다', async () => {
    const inputs: { from: string; to: string }[] = [];
    server.use(
      graphql.query('AdminDashboardSummary', ({ variables }) => {
        inputs.push((variables as { input: { from: string; to: string } }).input);
        return HttpResponse.json({ data: { adminDashboardSummary: summary } });
      }),
      gqlOk('AdminSearchKeywordSnapshot', { adminSearchKeywordSnapshot: snapshot }),
    );
    boot();
    expect(await screen.findByText('4,812,000원')).toBeInTheDocument();
    expect(screen.getByText('주문 163건')).toBeInTheDocument();
    expect(screen.getByText('7건')).toBeInTheDocument();
    expect(screen.getByText('처리 필요')).toBeInTheDocument();
    const table = screen.getByRole('table', { name: '주문 상태별 건수' });
    expect(within(table).getByText('78건')).toBeInTheDocument();
    expect(screen.getByText('생일 케이크')).toBeInTheDocument();
    expect(screen.getByText('09-27 17:00 스냅샷')).toBeInTheDocument();
    expect(inputs[0]?.from).toMatch(/T15:00:00\.000Z$/);
    expect(inputs[0]?.to).toMatch(/T14:59:59\.999Z$/);
  });

  it('프리셋을 누르면 URL과 조회 기간이 바뀐다', async () => {
    const inputs: { from: string; to: string }[] = [];
    server.use(
      graphql.query('AdminDashboardSummary', ({ variables }) => {
        inputs.push((variables as { input: { from: string; to: string } }).input);
        return HttpResponse.json({ data: { adminDashboardSummary: summary } });
      }),
      gqlOk('AdminSearchKeywordSnapshot', {
        adminSearchKeywordSnapshot: { rankedAt: null, items: [] },
      }),
    );
    boot();
    await screen.findByText('4,812,000원');
    await userEvent.click(screen.getByRole('button', { name: '오늘' }));
    await vi.waitFor(() => expect(window.location.search).toContain('period=today'));
    await vi.waitFor(() => expect(inputs.length).toBe(2));
    expect(inputs[1]?.from.slice(0, 10)).not.toBe(inputs[0]?.from.slice(0, 10));
    expect(screen.getByText('아직 집계된 검색어가 없습니다.')).toBeInTheDocument();
  });

  it('직접 지정은 날짜 입력을 적용해 조회한다', async () => {
    const inputs: { from: string; to: string }[] = [];
    server.use(
      graphql.query('AdminDashboardSummary', ({ variables }) => {
        inputs.push((variables as { input: { from: string; to: string } }).input);
        return HttpResponse.json({ data: { adminDashboardSummary: summary } });
      }),
      gqlOk('AdminSearchKeywordSnapshot', { adminSearchKeywordSnapshot: snapshot }),
    );
    boot('/?period=custom&from=2026-09-01&to=2026-09-10');
    expect(await screen.findByText('2026-09-01 ~ 2026-09-10')).toBeInTheDocument();
    expect(inputs[0]).toEqual({ from: '2026-08-31T15:00:00.000Z', to: '2026-09-10T14:59:59.999Z' });
    const from = screen.getByLabelText('시작일');
    await userEvent.clear(from);
    await userEvent.type(from, '2026-09-05');
    await userEvent.click(screen.getByRole('button', { name: '적용' }));
    expect(await screen.findByText('2026-09-05 ~ 2026-09-10')).toBeInTheDocument();
  });

  it('요약 조회가 실패하면 오류를 보여준다', async () => {
    server.use(
      gqlError('AdminDashboardSummary', {
        message: '기간이 잘못됨',
        code: 'DASHBOARD_RANGE_INVALID',
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
      gqlError('AdminSearchKeywordSnapshot', {
        message: '실패',
        classification: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
      }),
    );
    boot();
    // QueryClient 기본 retry 1회(지수 지연) 뒤에 에러 상태가 된다
    const alerts = await screen.findAllByRole('alert', {}, { timeout: 5000 });
    expect(alerts.map((a) => a.textContent)).toEqual(
      expect.arrayContaining([
        '기간이 잘못됨',
        '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      ]),
    );
  });
});
