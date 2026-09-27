import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, graphql } from 'msw';

import { App } from '@/app/app';
import { useAuthStore } from '@/features/auth';
import { gqlOk, restOk } from '@/test/msw/graphql';
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
const log = {
  id: 'l1',
  actorAccountId: '1',
  actorAccountType: 'ADMIN',
  storeId: '17',
  targetType: 'ORDER',
  targetId: '99',
  action: 'STATUS_CHANGE',
  beforeJson: '{"status":"CONFIRMED"}',
  afterJson: '{"status":"CANCELED"}',
  ipAddress: '1.2.3.4',
  userAgent: 'UA',
  createdAt: '2026-09-27T02:00:00.000Z',
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
  );
  window.history.pushState({}, '', path);
  render(<App />);
}

describe('감사 로그', () => {
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );

  it('URL 필터를 요청에 반영하고 상세 다이얼로그에 before/after를 보여준다', async () => {
    let input: Record<string, unknown> | undefined;
    server.use(
      graphql.query('AdminAuditLogs', ({ variables }) => {
        input = (variables as { input: Record<string, unknown> }).input;
        return HttpResponse.json({
          data: {
            adminAuditLogs: { items: [log], totalCount: 1, hasMore: false, nextCursor: null },
          },
        });
      }),
    );
    boot('/audit-logs?targetType=ORDER&targetId=99');
    expect(await screen.findByText('주문 #99')).toBeInTheDocument();
    expect(input).toMatchObject({ targetType: 'ORDER', targetId: '99', action: null });
    expect(screen.getByText('상태 변경')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '로그 l1 상세' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('"status": "CONFIRMED"');
    expect(dialog).toHaveTextContent('"status": "CANCELED"');
    expect(dialog).toHaveTextContent('IP 1.2.3.4');
  });

  it('주문 상세의 감사 이력 링크는 대상 필터를 넘긴다', async () => {
    server.use(
      gqlOk('AdminOrder', {
        adminOrder: {
          id: '99',
          orderNumber: 'CQ-1',
          buyer: { accountId: '10', email: null, nickname: 'n', status: 'ACTIVE' },
          status: 'PICKED_UP',
          pickupAt: '2026-09-28T05:00:00.000Z',
          buyerName: 'a',
          buyerPhone: 'b',
          subtotalPrice: 1,
          discountPrice: 0,
          totalPrice: 1,
          submittedAt: null,
          confirmedAt: null,
          madeAt: null,
          pickedUpAt: null,
          canceledAt: null,
          createdAt: '2026-09-27T02:20:00.000Z',
          updatedAt: '2026-09-27T02:34:00.000Z',
          items: [],
          statusHistories: [],
        },
      }),
    );
    boot('/orders/99');
    const link = await screen.findByRole('link', { name: '감사 이력' });
    expect(decodeURIComponent(link.getAttribute('href') ?? '')).toBe(
      '/audit-logs?targetType=ORDER&targetId="99"',
    );
  });
});
