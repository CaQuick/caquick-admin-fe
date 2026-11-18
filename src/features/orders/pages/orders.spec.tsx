import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, graphql } from 'msw';

import { App } from '@/app/app';
import { useAuthStore } from '@/features/auth';
import { forgetSearches } from '@/shared/lib/list-return';
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
const row = (id: string, status = 'CONFIRMED') => ({
  id,
  orderNumber: `CQ-2609-${id}`,
  accountId: '10',
  storeId: '17' as string | null,
  storeName: '달빛 케이크' as string | null,
  status,
  pickupAt: '2026-09-28T05:00:00.000Z',
  buyerName: '김서연',
  buyerPhone: '010-4321-1182',
  totalPrice: 48000,
  createdAt: '2026-09-27T02:20:00.000Z',
  hasCustom: false,
});
const LONG_REQUEST =
  '왼쪽 위에 강아지 얼굴을 크게 넣어 주세요.\n아래쪽에는 꽃 장식을 둘러 주시고, 글씨는 금색으로 부탁드립니다.';
const detail = {
  id: '1',
  orderNumber: 'CQ-2609-1',
  buyer: { accountId: '10', email: 'a@b.c', nickname: 'seoyeon', status: 'ACTIVE' },
  status: 'CONFIRMED',
  pickupAt: '2026-09-28T05:00:00.000Z',
  buyerName: '김서연',
  buyerPhone: '010-4321-1182',
  subtotalPrice: 48000,
  discountPrice: 0,
  totalPrice: 48000,
  submittedAt: '2026-09-27T02:20:00.000Z',
  confirmedAt: '2026-09-27T02:34:00.000Z',
  madeAt: null,
  pickedUpAt: null,
  canceledAt: null,
  createdAt: '2026-09-27T02:20:00.000Z',
  updatedAt: '2026-09-27T02:34:00.000Z',
  items: [
    {
      id: 'i1',
      storeId: '17',
      productId: '99',
      productName: '레터링 생크림 케이크',
      regularPrice: 45000,
      salePrice: null,
      quantity: 1,
      itemSubtotalPrice: 48000,
      optionItems: [{ id: 'o1', groupName: '맛', optionTitle: '얼그레이', priceDelta: 3000 }],
      customMode: 'SLOT',
      customPreviewImageUrl: 'https://img.test/composite.png',
      customBaseImageUrl: 'https://img.test/base.png',
      customImages: [
        { id: 'm1', kind: 'SLOT_COMPOSITE', imageUrl: 'https://img.test/composite.png' },
      ],
      customTexts: [
        {
          id: 'c3',
          tokenKey: 'slot3',
          label: '보내는 사람',
          defaultText: '엄마가',
          valueText: null,
          posX: 0,
          posY: 9000,
          width: 10000,
          height: 1000,
          textColor: '#000000',
          textAlign: 'RIGHT',
          sortOrder: 2,
        },
        {
          id: 'c1',
          tokenKey: 'msg',
          label: '메인 문구',
          defaultText: '축하해',
          valueText: '서연아 생일 축하해',
          posX: 1000,
          posY: 1000,
          width: 8000,
          height: 2000,
          textColor: '#1D1D1D',
          textAlign: 'CENTER',
          sortOrder: 0,
        },
        {
          id: 'c2',
          tokenKey: 'slot2',
          label: '날짜',
          defaultText: '9.28',
          valueText: '9.28',
          posX: 1000,
          posY: 4000,
          width: 3000,
          height: 1000,
          textColor: '#FF5A5F',
          textAlign: 'LEFT',
          sortOrder: 1,
        },
      ],
      freeEdits: [
        {
          id: 'f2',
          posX: 6000,
          posY: 5000,
          width: 2500,
          height: 2500,
          descriptionText: '리본 그려 주세요',
          sortOrder: 1,
          attachments: [],
        },
        {
          id: 'f1',
          posX: 1234,
          posY: 5678,
          width: 3000,
          height: 1000,
          descriptionText: LONG_REQUEST,
          sortOrder: 0,
          attachments: [
            { id: 'a2', imageUrl: 'https://img.test/b.png', sortOrder: 1 },
            { id: 'a1', imageUrl: 'https://img.test/a.png', sortOrder: 0 },
          ],
        },
      ],
    },
  ],
  statusHistories: [
    {
      id: 'h2',
      fromStatus: 'SUBMITTED',
      toStatus: 'CONFIRMED',
      changedAt: '2026-09-27T02:34:00.000Z',
      note: null,
    },
    {
      id: 'h1',
      fromStatus: null,
      toStatus: 'SUBMITTED',
      changedAt: '2026-09-27T02:20:00.000Z',
      note: null,
    },
  ],
};
// 확정·제작 완료는 사정(fault) 선택이 필요해 지금 다이얼로그로는 취소할 수 없다
const submitted = {
  ...detail,
  status: 'SUBMITTED',
  confirmedAt: null,
  statusHistories: detail.statusHistories.slice(1),
};

/** 매장·구매자 이름 조회 기본 응답. 테스트가 뒤에 등록한 핸들러가 이긴다 */
function useNameLookups() {
  server.use(
    gqlOk('AdminOrdersStoreName', {
      adminStore: { store: { id: '17', storeName: '달빛 케이크' } },
    }),
    gqlOk('AdminOrdersBuyerName', {
      adminUser: { accountId: '17', nickname: 'seoyeon', name: null, email: 'a@b.c' },
    }),
  );
}

const buyerCard = () =>
  screen
    .getAllByText('구매자')
    .find((el) => el.dataset.slot === 'card-title')!
    .closest<HTMLElement>('[data-slot="card"]')!;

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

describe('주문 목록', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false });
    useNameLookups();
  });

  it('목록을 보여주고 필터·커서를 URL과 요청에 반영한다', async () => {
    const inputs: Record<string, unknown>[] = [];
    server.use(
      graphql.query('AdminOrders', ({ variables }) => {
        const input = (variables as { input: Record<string, unknown> }).input;
        inputs.push(input);
        const page2 = input.cursor === 'next-1';
        return HttpResponse.json({
          data: {
            adminOrders: {
              items: page2 ? [row('3', 'PICKED_UP')] : [row('1'), row('2', 'CANCELED')],
              totalCount: 3,
              hasMore: !page2,
              nextCursor: page2 ? null : 'next-1',
            },
          },
        });
      }),
    );
    boot('/orders?status=CONFIRMED&q=%EA%B9%80');
    expect(await screen.findByText('CQ-2609-1')).toBeInTheDocument();
    expect(screen.getByText('전체 3건')).toBeInTheDocument();
    expect(inputs[0]).toMatchObject({
      status: 'CONFIRMED',
      keyword: '김',
      cursor: null,
      limit: 20,
    });

    await userEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(await screen.findByText('CQ-2609-3')).toBeInTheDocument();
    expect(window.location.search).toContain('cursor=next-1');
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: '처음' }));
    expect(await screen.findByText('CQ-2609-2')).toBeInTheDocument();
    expect(window.location.search).not.toContain('cursor');

    await userEvent.click(screen.getByRole('button', { name: '초기화' }));
    await screen.findByText('CQ-2609-1');
    expect(window.location.search).not.toContain('status');
    expect(inputs.at(-1)).toMatchObject({ status: null, keyword: null });
  });

  it('이전은 지나온 커서로 돌아가고 필터를 유지한다', async () => {
    server.use(
      graphql.query('AdminOrders', ({ variables }) => {
        const page2 = (variables as { input: { cursor: string | null } }).input.cursor === 'next-1';
        return HttpResponse.json({
          data: {
            adminOrders: {
              items: page2 ? [row('3')] : [row('1')],
              totalCount: 2,
              hasMore: !page2,
              nextCursor: page2 ? null : 'next-1',
            },
          },
        });
      }),
    );
    boot('/orders?status=CONFIRMED');
    await screen.findByText('CQ-2609-1');
    await userEvent.click(screen.getByRole('button', { name: '다음' }));
    await screen.findByText('CQ-2609-3');
    await userEvent.click(screen.getByRole('button', { name: '이전' }));
    await screen.findByText('CQ-2609-1');
    expect(window.location.search).toBe('?status=CONFIRMED');
    expect(screen.queryByRole('button', { name: '이전' })).not.toBeInTheDocument();
  });

  it('검색어 제출은 커서를 버리고 첫 페이지부터 조회한다', async () => {
    const inputs: Record<string, unknown>[] = [];
    server.use(
      graphql.query('AdminOrders', ({ variables }) => {
        inputs.push((variables as { input: Record<string, unknown> }).input);
        return HttpResponse.json({
          data: {
            adminOrders: { items: [row('1')], totalCount: 1, hasMore: false, nextCursor: null },
          },
        });
      }),
    );
    boot('/orders?cursor=zzz');
    await screen.findByText('CQ-2609-1');
    await userEvent.type(screen.getByRole('textbox', { name: '검색어' }), '서연{enter}');
    await vi.waitFor(() => expect(inputs.at(-1)).toMatchObject({ keyword: '서연', cursor: null }));
    expect(window.location.search).toContain('q=');
    expect(window.location.search).not.toContain('cursor');
  });

  it('URL의 잘못된 ID는 버리고 긴 검색어는 100자로 잘라 보낸다', async () => {
    const inputs: Record<string, unknown>[] = [];
    server.use(
      graphql.query('AdminOrders', ({ variables }) => {
        inputs.push((variables as { input: Record<string, unknown> }).input);
        return HttpResponse.json({
          data: {
            adminOrders: { items: [row('1')], totalCount: 1, hasMore: false, nextCursor: null },
          },
        });
      }),
    );
    boot(`/orders?storeId=abc&accountId=17&q=${'a'.repeat(101)}`);
    await screen.findByText('CQ-2609-1');
    expect(inputs[0]).toMatchObject({ storeId: null, accountId: '17', keyword: 'a'.repeat(100) });
    // 입력칸 상한은 FilterBar가 코드 포인트로 자른다(filter-bar.spec) — URL 값은 잘린 채 보인다
    expect(screen.getByRole('textbox', { name: '검색어' })).toHaveValue('a'.repeat(100));
  });

  it.each([
    ['매장명 스냅샷', { storeId: '17', storeName: '달빛 케이크' }, '달빛 케이크', '/stores/17'],
    ['매장명이 없으면 #ID', { storeId: '17', storeName: null }, '#17', '/stores/17'],
    ['ID "0"도 매장으로', { storeId: '0', storeName: null }, '#0', '/stores/0'],
    ['품목 없는 주문', { storeId: null, storeName: null }, '—', null],
  ] as const)('매장 칸: %s', async (_, store, text, href) => {
    server.use(
      gqlOk('AdminOrders', {
        adminOrders: {
          items: [{ ...row('1'), ...store }],
          totalCount: 1,
          hasMore: false,
          nextCursor: null,
        },
      }),
    );
    boot('/orders');
    const table = await screen.findByRole('table');
    await within(table).findByText('CQ-2609-1');
    const storeCol = within(table)
      .getAllByRole('columnheader')
      .findIndex((h) => h.textContent === '매장');
    const cell = within(table).getAllByRole('row')[1]!.querySelectorAll('td')[storeCol]!;
    expect(cell).toHaveTextContent(text);
    const link = within(cell).queryByRole('link');
    if (href === null) expect(link).toBeNull();
    else expect(link).toHaveAttribute('href', href);
  });

  it('커스텀 주문만 주문번호 옆에 커스텀 배지를 단다', async () => {
    server.use(
      gqlOk('AdminOrders', {
        adminOrders: {
          items: [{ ...row('1'), hasCustom: true }, row('2')],
          totalCount: 2,
          hasMore: false,
          nextCursor: null,
        },
      }),
    );
    boot('/orders');
    const custom = (await screen.findByRole('link', { name: 'CQ-2609-1' })).closest('td')!;
    expect(within(custom).getByText('커스텀')).toBeInTheDocument();
    const plain = screen.getByRole('link', { name: 'CQ-2609-2' }).closest('td')!;
    expect(within(plain).queryByText('커스텀')).not.toBeInTheDocument();
  });

  it('날짜 칸 제목은 주문일이고 CONFIRMED는 주문 확정으로 보인다', async () => {
    server.use(
      gqlOk('AdminOrders', {
        adminOrders: { items: [row('1')], totalCount: 1, hasMore: false, nextCursor: null },
      }),
    );
    boot('/orders');
    const table = await screen.findByRole('table');
    await within(table).findByText('CQ-2609-1');
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((h) => h.textContent);
    expect(headers).toContain('주문일');
    expect(headers).not.toContain('생성');
    expect(within(table).getByText('주문 확정')).toBeInTheDocument();
  });

  it('필터마다 보이는 이름이 붙고 주문일 범위는 한 묶음이다', async () => {
    server.use(
      gqlOk('AdminOrders', {
        adminOrders: { items: [row('1')], totalCount: 1, hasMore: false, nextCursor: null },
      }),
    );
    boot('/orders');
    await screen.findByText('CQ-2609-1');
    for (const name of ['상태', '매장', '구매자']) {
      expect(screen.getByRole('group', { name })).toBeInTheDocument();
    }
    const period = screen.getByRole('group', { name: '주문일' });
    expect(within(period).getByLabelText('주문일 시작')).toBeInTheDocument();
    expect(within(period).getByLabelText('주문일 끝')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: '매장 ID' })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: '계정 ID' })).not.toBeInTheDocument();
  });

  it('매장·구매자를 이름으로 검색해 고르면 ID로 거르고, 해제하면 필터를 뺀다', async () => {
    const inputs: Record<string, unknown>[] = [];
    const storeKeywords: unknown[] = [];
    server.use(
      graphql.query('AdminOrders', ({ variables }) => {
        inputs.push((variables as { input: Record<string, unknown> }).input);
        return HttpResponse.json({
          data: {
            adminOrders: { items: [row('1')], totalCount: 1, hasMore: false, nextCursor: null },
          },
        });
      }),
      graphql.query('AdminOrdersStoreOptions', ({ variables }) => {
        const input = (variables as { input: { keyword: string | null; limit: number } }).input;
        storeKeywords.push(input.keyword);
        const all = [
          { id: '17', storeName: '달빛 케이크', isActive: true },
          { id: '0', storeName: '달빛 베이커리', isActive: false },
        ];
        return HttpResponse.json({
          data: {
            adminStores: {
              items: all.filter((s) => !input.keyword || s.storeName.includes(input.keyword)),
            },
          },
        });
      }),
      gqlOk('AdminOrdersStoreName', {
        adminStore: { store: { id: '0', storeName: '달빛 베이커리' } },
      }),
      gqlOk('AdminOrdersBuyerOptions', {
        adminUsers: {
          items: [{ accountId: '10', nickname: 'seoyeon', name: '김서연', email: 's@y.kr' }],
        },
      }),
      gqlOk('AdminOrdersBuyerName', {
        adminUser: { accountId: '10', nickname: 'seoyeon', name: '김서연', email: 's@y.kr' },
      }),
    );
    boot('/orders?cursor=zzz');
    await screen.findByText('CQ-2609-1');

    await userEvent.click(screen.getByRole('combobox', { name: /^매장/ }));
    await userEvent.type(screen.getByRole('combobox', { name: '매장 검색' }), '베이커리');
    const option = await screen.findByRole('option', { name: /달빛 베이커리/ });
    expect(option).toHaveTextContent('숨김');
    await vi.waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1));
    expect(storeKeywords).toContain('베이커리');
    await userEvent.click(screen.getByRole('option', { name: /달빛 베이커리/ }));
    await vi.waitFor(() => expect(inputs.at(-1)).toMatchObject({ storeId: '0', cursor: null }));
    expect(window.location.search).toContain('storeId=0');
    expect(window.location.search).not.toContain('cursor');
    expect(screen.getByRole('combobox', { name: /^매장/ })).toHaveTextContent('달빛 베이커리');

    await userEvent.click(screen.getByRole('combobox', { name: /^구매자/ }));
    const buyer = await screen.findByRole('option', { name: /seoyeon/ });
    expect(buyer).toHaveTextContent('s@y.kr');
    await userEvent.click(buyer);
    await vi.waitFor(() => expect(inputs.at(-1)).toMatchObject({ storeId: '0', accountId: '10' }));

    await userEvent.click(screen.getByRole('button', { name: '매장 선택 해제' }));
    await vi.waitFor(() => expect(inputs.at(-1)).toMatchObject({ storeId: null, accountId: '10' }));
    expect(window.location.search).not.toContain('storeId');
  });

  it('주소로 들어온 매장·구매자 ID는 이름을 불러 선택기에 보인다', async () => {
    server.use(
      gqlOk('AdminOrders', {
        adminOrders: { items: [row('1')], totalCount: 1, hasMore: false, nextCursor: null },
      }),
    );
    boot('/orders?storeId=17&accountId=17');
    await screen.findByText('CQ-2609-1');
    await vi.waitFor(() =>
      expect(screen.getByRole('combobox', { name: /^매장/ })).toHaveTextContent('달빛 케이크'),
    );
    await vi.waitFor(() =>
      expect(screen.getByRole('combobox', { name: /^구매자/ })).toHaveTextContent('seoyeon'),
    );
  });

  it('이름을 불러오지 못하면 선택기는 #ID로 보인다', async () => {
    let lookups = 0;
    server.use(
      gqlOk('AdminOrders', {
        adminOrders: { items: [row('1')], totalCount: 1, hasMore: false, nextCursor: null },
      }),
      graphql.query('AdminOrdersStoreName', () => {
        lookups += 1;
        return HttpResponse.json({
          data: null,
          errors: [
            {
              message: '매장을 찾을 수 없습니다.',
              extensions: { code: 'STORE_NOT_FOUND', classification: 'NOT_FOUND', statusCode: 404 },
            },
          ],
        });
      }),
    );
    boot('/orders?storeId=404');
    await screen.findByText('CQ-2609-1');
    await vi.waitFor(() => expect(lookups).toBe(1));
    expect(screen.getByRole('combobox', { name: /^매장/ })).toHaveTextContent('#404');
  });

  it('조회 실패는 오류 문구', async () => {
    server.use(
      gqlError('AdminOrders', {
        message: '커서가 잘못됨',
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
    );
    boot('/orders');
    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent(
      '커서가 잘못됨',
    );
  });
});

describe('주문 상세', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false });
    useNameLookups();
    forgetSearches();
  });

  it('구매자·상품·옵션·문구·이력을 보여주고 취소 시 사유를 보내며 목록·상세를 갱신한다', async () => {
    let detailCalls = 0;
    let cancelInput: unknown;
    server.use(
      graphql.query('AdminOrder', () => {
        detailCalls += 1;
        return HttpResponse.json({
          data: {
            adminOrder:
              detailCalls === 1
                ? submitted
                : { ...submitted, status: 'CANCELED', canceledAt: '2026-09-27T03:00:00.000Z' },
          },
        });
      }),
      graphql.mutation('AdminCancelOrder', ({ variables }) => {
        cancelInput = (variables as { input: unknown }).input;
        return HttpResponse.json({ data: { adminCancelOrder: { id: '1', status: 'CANCELED' } } });
      }),
    );
    boot('/orders/1');
    expect(await screen.findByText('레터링 생크림 케이크')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '목록으로' })).toHaveAttribute('href', '/orders');
    expect(screen.getByText('맛: 얼그레이')).toBeInTheDocument();
    expect(screen.getByText(/서연아 생일 축하해/)).toBeInTheDocument();
    expect(screen.getByText('seoyeon')).toBeInTheDocument();
    const history = screen.getByText('상태 이력').closest<HTMLElement>('[data-slot="card"]')!;
    expect(within(history).getAllByRole('listitem')).toHaveLength(1);

    await userEvent.click(screen.getByRole('button', { name: '주문 취소' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: '주문 취소' });
    expect(confirm).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText('취소 사유 (필수)'), '  재고 없음  ');
    await userEvent.click(confirm);
    await vi.waitFor(() =>
      expect(cancelInput).toEqual({ orderId: '1', reason: 'OTHER', note: '재고 없음' }),
    );
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText(/취소됨/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '주문 취소' })).not.toBeInTheDocument();
    expect(detailCalls).toBe(2);
  });

  it.each(['CONFIRMED', 'MADE'])(
    '%s 주문은 사정 선택이 필요해 취소 버튼이 없다',
    async (status) => {
      server.use(gqlOk('AdminOrder', { adminOrder: { ...detail, status } }));
      boot('/orders/1');
      await screen.findByText('레터링 생크림 케이크');
      expect(screen.queryByRole('button', { name: '주문 취소' })).not.toBeInTheDocument();
    },
  );

  it('상품·매장·구매자를 해당 상세로 잇고 계정 상태는 한국어로 보인다', async () => {
    server.use(gqlOk('AdminOrder', { adminOrder: detail }));
    boot('/orders/1');
    expect(await screen.findByRole('link', { name: '레터링 생크림 케이크' })).toHaveAttribute(
      'href',
      '/products/99',
    );
    expect(await screen.findByRole('link', { name: '매장 달빛 케이크' })).toHaveAttribute(
      'href',
      '/stores/17',
    );
    const buyer = buyerCard();
    expect(within(buyer).getByRole('link', { name: 'seoyeon' })).toHaveAttribute(
      'href',
      '/users/10',
    );
    expect(within(buyer).getByRole('link', { name: '10' })).toHaveAttribute('href', '/users/10');
    expect(within(buyer).getByText('활성')).toBeInTheDocument();
    expect(within(buyer).queryByText('ACTIVE')).not.toBeInTheDocument();
  });

  it('탈퇴한 구매자는 링크 없이 탈퇴 회원·계정 ID로, 매장 이름을 못 불러오면 #ID로 보인다', async () => {
    server.use(
      gqlOk('AdminOrder', {
        adminOrder: {
          ...detail,
          buyer: { accountId: '10', email: null, nickname: null, status: 'SUSPENDED' },
        },
      }),
      gqlError('AdminOrdersStoreName', {
        message: '매장을 찾을 수 없습니다.',
        code: 'STORE_NOT_FOUND',
        classification: 'NOT_FOUND',
        statusCode: 404,
      }),
    );
    boot('/orders/1');
    await screen.findByText('레터링 생크림 케이크');
    const buyer = buyerCard();
    // 탈퇴 계정은 구매자 상세가 NOT_FOUND라 잇지 않는다
    expect(within(buyer).queryByRole('link')).not.toBeInTheDocument();
    expect(within(buyer).getAllByText('탈퇴 회원')).toHaveLength(1);
    expect(within(buyer).getByText('#10')).toBeInTheDocument();
    expect(within(buyer).getByText('10')).toBeInTheDocument();
    expect(within(buyer).getByText('정지')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: '매장 #17' })).toHaveAttribute(
      'href',
      '/stores/17',
    );
  });

  it('슬롯형은 합성 이미지와 문구 자리 표(입력 문구·기본 대비·글자색·정렬)를 자리 순서로 보인다', async () => {
    server.use(gqlOk('AdminOrder', { adminOrder: detail }));
    boot('/orders/1');
    const custom = await screen.findByRole('region', { name: '커스텀 내용' });
    expect(within(custom).getByText('커스텀 · 슬롯형')).toBeInTheDocument();
    expect(
      within(custom).getByRole('link', { name: '합성 이미지 원본 보기(새 탭)' }),
    ).toHaveAttribute('href', 'https://img.test/composite.png');
    const rows = within(within(custom).getByRole('table', { name: '문구 자리' }))
      .getAllByRole('row')
      .map((r) => r.textContent);
    expect(rows).toEqual([
      '문구 자리입력 문구기본 문구 대비글자색정렬',
      '메인 문구서연아 생일 축하해바꿈기본: 축하해#1D1D1D가운데',
      '날짜9.28기본 그대로#FF5A5F왼쪽',
      '보내는 사람—문구 없음#000000오른쪽',
    ]);
    expect(within(custom).queryByRole('list', { name: '3D 렌더 이미지' })).not.toBeInTheDocument();
  });

  it('자유 편집은 바탕 위 번호 영역과 요청 문구 전문·참고 사진을 요청 순서로 보인다', async () => {
    server.use(gqlOk('AdminOrder', { adminOrder: detail }));
    boot('/orders/1');
    const figure = await screen.findByRole('figure', { name: '바탕 위 자유 편집 영역' });
    expect(within(figure).getByRole('img', { name: '바탕 이미지' })).toHaveAttribute(
      'src',
      'https://img.test/base.png',
    );
    const areas = [...figure.querySelectorAll<HTMLElement>('[data-area]')].map((a) => [
      a.textContent,
      a.style.left,
      a.style.top,
      a.style.width,
      a.style.height,
    ]);
    expect(areas).toEqual([
      ['1', '12.34%', '56.78%', '30%', '10%'],
      ['2', '60%', '50%', '25%', '25%'],
    ]);

    const first = screen.getByRole('listitem', { name: '자유 편집 1' });
    const request = within(first).getByText(
      (_, el) => el?.tagName === 'P' && el.textContent === LONG_REQUEST,
    );
    expect(request.className).not.toContain('truncate');
    expect(request).toHaveClass('whitespace-pre-wrap');
    expect(screen.getByRole('listitem', { name: '자유 편집 2' })).toHaveTextContent(
      '리본 그려 주세요',
    );

    const list = within(first).getByRole('list', { name: '자유 편집 1 참고 사진' });
    const images = within(list).getAllByRole('img');
    expect(images.map((i) => i.getAttribute('src'))).toEqual([
      'https://img.test/a.png',
      'https://img.test/b.png',
    ]);
    for (const img of images) {
      const link = img.closest('a')!;
      expect(link).toHaveAttribute('href', img.getAttribute('src'));
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer');
    }
    expect(within(first).getByText('참고 사진 2장')).toBeInTheDocument();
    expect(screen.getByText('자유 편집 2건')).toBeInTheDocument();
  });

  it('요청 문구가 비어 있으면 없다고 알리고 참고 사진이 없으면 사진 목록을 두지 않는다', async () => {
    const item = detail.items[0]!;
    server.use(
      gqlOk('AdminOrder', {
        adminOrder: {
          ...detail,
          items: [
            {
              ...item,
              freeEdits: [{ ...item.freeEdits[1]!, descriptionText: '  ', attachments: [] }],
            },
          ],
        },
      }),
    );
    boot('/orders/1');
    expect(await screen.findByText('요청 문구가 없습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: /참고 사진/ })).not.toBeInTheDocument();
  });

  it('바탕 이미지가 없는 옛 주문은 영역 그림 없이 요청만 보인다', async () => {
    const item = detail.items[0]!;
    server.use(
      gqlOk('AdminOrder', {
        adminOrder: { ...detail, items: [{ ...item, customBaseImageUrl: null }] },
      }),
    );
    boot('/orders/1');
    expect(await screen.findByRole('listitem', { name: '자유 편집 1' })).toBeInTheDocument();
    expect(screen.queryByRole('figure')).not.toBeInTheDocument();
  });

  it('3D는 렌더 5장을 윗면 크게 → 앞·뒤·왼·오 순서로, 모르는 종류는 원문 라벨로 뒤에 보이고 문구 표는 없다', async () => {
    const item = detail.items[0]!;
    const render = (kind: string) => ({
      id: kind,
      kind,
      imageUrl: `https://img.test/${kind}.png`,
    });
    server.use(
      gqlOk('AdminOrder', {
        adminOrder: {
          ...detail,
          items: [
            {
              ...item,
              customMode: 'THREE_D',
              customPreviewImageUrl: 'https://img.test/THREE_D_TOP.png',
              customBaseImageUrl: null,
              customImages: [
                'HOLOGRAM',
                'THREE_D_RIGHT',
                'THREE_D_LEFT',
                'THREE_D_TOP',
                'THREE_D_BACK',
                'THREE_D_FRONT',
              ].map(render),
              customTexts: [],
              freeEdits: [],
            },
          ],
        },
      }),
    );
    boot('/orders/1');
    const list = await screen.findByRole('list', { name: '3D 렌더 이미지' });
    const links = within(list).getAllByRole('link');
    expect(links.map((l) => l.getAttribute('aria-label'))).toEqual([
      '3D 윗면 원본 보기(새 탭)',
      '3D 앞 원본 보기(새 탭)',
      '3D 뒤 원본 보기(새 탭)',
      '3D 왼쪽 원본 보기(새 탭)',
      '3D 오른쪽 원본 보기(새 탭)',
      'HOLOGRAM 원본 보기(새 탭)',
    ]);
    expect(links.map((l) => l.getAttribute('href'))[0]).toBe('https://img.test/THREE_D_TOP.png');
    expect(links.map((l) => l.querySelector('img')!.classList.contains('size-40'))).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
    ]);
    const custom = screen.getByRole('region', { name: '커스텀 내용' });
    expect(within(custom).getByText('커스텀 · 3D')).toBeInTheDocument();
    expect(within(custom).queryByRole('table')).not.toBeInTheDocument();
    expect(within(custom).queryByText(/합성 이미지/)).not.toBeInTheDocument();
  });

  it.each([
    ['슬롯형에 합성 이미지 기록이 없으면 대표 이미지를 합성으로', 'SLOT', '커스텀 · 슬롯형', true],
    ['방식이 없는데 문구가 남은 품목은 방식 없이', 'NONE', '커스텀', false],
  ] as const)('옛 주문: %s 보인다', async (_, customMode, badge, composite) => {
    const item = detail.items[0]!;
    server.use(
      gqlOk('AdminOrder', {
        adminOrder: { ...detail, items: [{ ...item, customMode, customImages: [] }] },
      }),
    );
    boot('/orders/1');
    const custom = await screen.findByRole('region', { name: '커스텀 내용' });
    expect(within(custom).getByText(badge)).toBeInTheDocument();
    const link = within(custom).queryByRole('link', { name: '합성 이미지 원본 보기(새 탭)' });
    if (composite) expect(link).toHaveAttribute('href', 'https://img.test/composite.png');
    else expect(link).toBeNull();
    expect(within(custom).getByRole('table', { name: '문구 자리' })).toBeInTheDocument();
  });

  it('커스텀이 없는 품목은 커스텀 내용을 두지 않는다', async () => {
    const item = detail.items[0]!;
    server.use(
      gqlOk('AdminOrder', {
        adminOrder: {
          ...detail,
          items: [
            {
              ...item,
              customMode: 'NONE',
              customPreviewImageUrl: null,
              customBaseImageUrl: null,
              customImages: [],
              customTexts: [],
              freeEdits: [],
            },
          ],
        },
      }),
    );
    boot('/orders/1');
    await screen.findByText('레터링 생크림 케이크');
    expect(screen.queryByRole('region', { name: '커스텀 내용' })).not.toBeInTheDocument();
  });

  it.each([
    ['진행 상태', /^픽업 예정/],
    ['주문 상품', '주문 당시 정보 · 1개'],
    ['상태 이력', '최신순'],
  ])('%s 카드의 보조 문구는 카드 설명 자리에 있다', async (title, caption) => {
    server.use(gqlOk('AdminOrder', { adminOrder: detail }));
    boot('/orders/1');
    const header = (await screen.findByText(title)).closest<HTMLElement>(
      '[data-slot="card-header"]',
    )!;
    expect(header.className).not.toContain('flex-row');
    expect(within(header).getByText(caption)).toHaveAttribute('data-slot', 'card-description');
  });

  it('CONFIRMED는 머리말·진행 단계·이력에서 주문 확정으로 보인다', async () => {
    server.use(gqlOk('AdminOrder', { adminOrder: detail }));
    boot('/orders/1');
    await screen.findByText('레터링 생크림 케이크');
    // 머리말 상태, 진행 단계, 이력의 도착 상태
    expect(screen.getAllByText('주문 확정')).toHaveLength(3);
    expect(screen.queryByText('확인')).not.toBeInTheDocument();
  });

  it('취소 실패는 토스트로 알리고 다이얼로그는 남는다', async () => {
    server.use(
      gqlOk('AdminOrder', { adminOrder: submitted }),
      gqlError('AdminCancelOrder', {
        message: '이미 픽업된 주문',
        code: 'ORDER_NOT_CANCELABLE',
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
    );
    boot('/orders/1');
    await userEvent.click(await screen.findByRole('button', { name: '주문 취소' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('취소 사유 (필수)'), '사유');
    await userEvent.click(within(dialog).getByRole('button', { name: '주문 취소' }));
    expect(await screen.findByText('이미 픽업된 주문')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('없는 주문은 NOT_FOUND 문구와 목록 링크', async () => {
    server.use(
      gqlError('AdminOrder', {
        message: '주문을 찾을 수 없습니다.',
        code: 'ORDER_NOT_FOUND',
        classification: 'NOT_FOUND',
        statusCode: 404,
      }),
    );
    boot('/orders/999');
    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent(
      '주문을 찾을 수 없습니다.',
    );
    expect(screen.getByRole('link', { name: '목록으로' })).toHaveAttribute('href', '/orders');
  });
});
