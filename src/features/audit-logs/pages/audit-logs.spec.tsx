import { render, screen, within } from '@testing-library/react';
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
  actorLabel: '운영자(ops.admin)',
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

  it('URL 필터를 요청에 반영하고 상세 다이얼로그에 항목 표와 접힌 원문을 보여준다', async () => {
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
    expect(await screen.findByRole('link', { name: '주문 #99' })).toHaveAttribute(
      'href',
      '/orders/99',
    );
    expect(input).toMatchObject({ targetType: 'ORDER', targetId: '99', action: null });
    expect(screen.getByText('상태 변경')).toBeInTheDocument();
    for (const h of ['작업', '작업자']) {
      expect(screen.getByRole('columnheader', { name: h })).toBeInTheDocument();
    }
    expect(screen.queryByRole('columnheader', { name: /행위자|액션/ })).not.toBeInTheDocument();
    expect(screen.getByText('운영자(ops.admin)').parentElement).toHaveTextContent(
      '운영자(ops.admin)관리자',
    );
    expect(screen.getByRole('link', { name: '#17' })).toHaveAttribute('href', '/stores/17');
    // 필터 라벨
    for (const name of ['대상', '작업', '작업자', '매장', '기간']) {
      expect(screen.getByRole('group', { name })).toBeInTheDocument();
    }

    const detail = screen.getByRole('button', { name: '로그 l1 상세' });
    expect(detail).toHaveTextContent('상세');
    await userEvent.click(detail);
    const dialog = await screen.findByRole('dialog');
    expect(dialog.className).toContain('sm:max-w-3xl');
    expect(dialog).toHaveTextContent('작업자 운영자(ops.admin)(관리자)');
    const row = within(dialog).getByRole('rowheader', { name: /상태/ }).closest('tr')!;
    expect(
      within(row)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['CONFIRMED', 'CANCELED']);
    expect(within(dialog).getByRole('rowheader', { name: '상태(바뀜)' })).toBeInTheDocument();
    const raw = dialog.querySelector('details')!;
    expect(raw).not.toHaveAttribute('open');
    expect(within(raw).getByText('기록 원문 보기')).toBeInTheDocument();
    expect(raw).toHaveTextContent('"status": "CONFIRMED"');
    expect(dialog).toHaveTextContent('IP 1.2.3.4');
  });

  it('JSON이 객체가 아니면 표 없이 원문을 바로 보인다', async () => {
    server.use(
      gqlOk('AdminAuditLogs', {
        adminAuditLogs: {
          items: [{ ...log, beforeJson: null, afterJson: '[1,2]', actorLabel: null }],
          totalCount: 1,
          hasMore: false,
          nextCursor: null,
        },
      }),
    );
    boot('/audit-logs');
    await userEvent.click(await screen.findByRole('button', { name: '로그 l1 상세' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByRole('table')).not.toBeInTheDocument();
    expect(dialog.querySelector('details')).toBeNull();
    expect(dialog).toHaveTextContent('1, 2');
    expect(dialog).toHaveTextContent('작업자 #1(관리자)');
  });

  it.each([
    ['ORDER', '주문 #5', '/orders/5'],
    ['STORE', '매장 #5', '/stores/5'],
    ['PRODUCT', '상품 #5', '/products/5'],
    ['BANNER', '배너 #5', '/banners/5'],
    ['REVIEW', '리뷰 #5', '/reviews?reviewId=5&deleted=true'],
    ['REVIEW_REPORT', '신고 #5', '/reports/5'],
    ['ACCOUNT', '계정 #5', null],
    ['CHANGE_PASSWORD', '비밀번호 변경 #5', null],
    ['CATEGORY', '카테고리 #5', null],
    ['TAG', '태그 #5', null],
    ['REGION', '지역 #5', null],
    ['REVIEW_COMMENT', '리뷰 댓글 #5', null],
    ['NOTIFICATION', '알림 #5', null],
    ['CONVERSATION', '대화 #5', null],
  ])('대상 %s는 "%s" → %s', async (targetType, text, href) => {
    server.use(
      gqlOk('AdminAuditLogs', {
        adminAuditLogs: {
          items: [{ ...log, targetType, targetId: '5' }],
          totalCount: 1,
          hasMore: false,
          nextCursor: null,
        },
      }),
    );
    boot('/audit-logs');
    const cell = await screen.findByText(text);
    if (href === null) expect(cell.closest('a')).toBeNull();
    else expect(decodeURIComponent(cell.closest('a')!.getAttribute('href')!)).toBe(href);
  });

  it.each([
    ['SELLER', '판매자', '/sellers/3'],
    ['USER', '구매자', '/users/3'],
    ['ADMIN', '관리자', null],
    [null, '삭제된 계정', null],
  ])('작업자 종류 %s는 "%s" 표시, 링크 %s', async (actorAccountType, typeLabel, href) => {
    server.use(
      gqlOk('AdminAuditLogs', {
        adminAuditLogs: {
          items: [{ ...log, actorAccountId: '3', actorAccountType, actorLabel: 'kim(kim01)' }],
          totalCount: 1,
          hasMore: false,
          nextCursor: null,
        },
      }),
    );
    boot('/audit-logs');
    const name = await screen.findByText('kim(kim01)');
    expect(name.parentElement).toHaveTextContent(typeLabel);
    if (href === null) expect(name.closest('a')).toBeNull();
    else expect(name.closest('a')).toHaveAttribute('href', href);
  });

  it('작업자 선택기는 판매자 검색과 이름·아이디로 거른 관리자를 보이고 고르면 actorAccountId로 거른다', async () => {
    const inputs: Record<string, unknown>[] = [];
    const pickerVars: unknown[] = [];
    server.use(
      graphql.query('AdminAuditLogs', ({ variables }) => {
        inputs.push((variables as { input: Record<string, unknown> }).input);
        return HttpResponse.json({
          data: {
            adminAuditLogs: { items: [log], totalCount: 1, hasMore: false, nextCursor: null },
          },
        });
      }),
      graphql.query('AdminAuditActorPicker', ({ variables }) => {
        pickerVars.push(variables);
        return HttpResponse.json({
          data: {
            adminSellers: {
              items: [{ accountId: '30', username: 'kim01', name: '김판매' }],
            },
            adminAdmins: {
              items: [
                { accountId: '1', username: 'ops.admin', name: '운영자' },
                { accountId: '2', username: 'kimadmin', name: null },
                { accountId: '4', username: null, name: null },
              ],
            },
          },
        });
      }),
    );
    boot('/audit-logs');
    await screen.findByRole('link', { name: '주문 #99' });
    await userEvent.click(screen.getByRole('combobox', { name: /^작업자/ }));
    expect(await screen.findByRole('option', { name: /#4/ })).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(4);
    await userEvent.type(screen.getByRole('combobox', { name: '작업자 검색' }), 'KIM');
    await vi.waitFor(() =>
      expect(pickerVars.at(-1)).toEqual({
        sellers: { keyword: 'KIM', limit: 20 },
        admins: { limit: 100 },
      }),
    );
    await vi.waitFor(() =>
      expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
        'kimadmin관리자 #2',
        '김판매(kim01)판매자 #30',
      ]),
    );
    await userEvent.click(screen.getByRole('option', { name: /김판매/ }));
    await vi.waitFor(() => expect(inputs.at(-1)).toMatchObject({ actorAccountId: '30' }));
  });

  it('URL의 숫자가 아닌 ID 필터는 요청에 싣지 않는다', async () => {
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
    boot('/audit-logs?targetId=abc&actorId=1.5&storeId=17');
    await screen.findByRole('link', { name: '주문 #99' });
    expect(input).toMatchObject({ targetId: null, actorAccountId: null, storeId: '17' });
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
      '/audit-logs?targetType=ORDER&targetId=99',
    );
  });
});
