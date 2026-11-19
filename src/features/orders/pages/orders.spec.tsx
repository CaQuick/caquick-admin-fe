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
      actorType: 'SELLER',
      cancelReason: null,
      cancelFault: null,
      refundAmount: null,
    },
    {
      id: 'h1',
      fromStatus: 'PENDING_PAYMENT',
      toStatus: 'SUBMITTED',
      changedAt: '2026-09-27T02:20:00.000Z',
      note: null,
      actorType: 'ADMIN',
      cancelReason: null,
      cancelFault: null,
      refundAmount: null,
    },
  ],
  requestNote: null as string | null,
  payment: {
    method: 'BANK_TRANSFER',
    status: 'CONFIRMED',
    amount: 48000,
    depositorName: '김서연',
    depositBank: { code: '020', name: '우리은행' },
    depositAccountNumber: '1002123456789',
    depositAccountHolder: '케이퀵',
    expiresAt: '2026-09-27T03:10:00.000Z',
    buyerClaimedAt: null,
    confirmedAt: '2026-09-27T02:20:00.000Z',
    confirmSource: 'ADMIN',
    confirmedByLabel: '운영자(ops.admin)',
    confirmNote: null,
  } as Record<string, unknown> | null,
  refunds: [] as Record<string, unknown>[],
  cancellation: null as Record<string, unknown> | null,
  cancelOptions: {
    cancelable: true,
    reasons: ['OUT_OF_MATERIALS', 'BUYER_REQUEST', 'OTHER'],
    refundRule: 'BY_FAULT' as string | null,
    paidAmount: 48000,
  },
  confirmDeadlineAt: null as string | null,
  autoPickupAt: '2026-09-29T05:00:00.000Z' as string | null,
  noShowAt: null as string | null,
  pickupChanges: [] as Record<string, unknown>[],
  commissionRateBps: 1000,
  expectedPayoutAmount: 43200 as number | null,
  settlementBaseAmount: null as number | null,
  commissionAmount: null as number | null,
  settlementFinalizedAt: null as string | null,
  settlementId: null as string | null,
};
const submitted = {
  ...detail,
  status: 'SUBMITTED',
  confirmedAt: null,
  statusHistories: detail.statusHistories.slice(1),
  cancelOptions: { ...detail.cancelOptions, refundRule: 'FULL_REFUND' },
  confirmDeadlineAt: '2026-09-28T02:20:00.000Z',
  autoPickupAt: null,
};
const canceledBy = (refundAmount: number) => ({
  ...detail,
  status: 'CANCELED',
  canceledAt: '2026-09-27T03:00:00.000Z',
  cancelOptions: { cancelable: false, reasons: [], refundRule: null, paidAmount: 48000 },
  autoPickupAt: null,
  cancellation: {
    actorType: 'ADMIN',
    reason: 'BUYER_REQUEST',
    reasonLabel: '구매자 요청',
    note: '구매자가 전화로 요청',
    fault: 'BUYER',
    refundAmount,
    refundStatus: 'AWAITING_ACCOUNT',
    refundCompletedAt: null,
    canceledAt: '2026-09-27T03:00:00.000Z',
  },
});

const pendingPayment = {
  ...submitted,
  status: 'PENDING_PAYMENT',
  submittedAt: null,
  statusHistories: [],
  payment: {
    ...detail.payment,
    status: 'PENDING',
    confirmedAt: null,
    confirmSource: null,
    confirmedByLabel: null,
  },
  cancelOptions: {
    cancelable: true,
    reasons: ['PAYMENT_NOT_RECEIVED', 'OTHER'],
    refundRule: 'NO_REFUND',
    paidAmount: 0,
  },
  confirmDeadlineAt: null,
  expectedPayoutAmount: null,
};
const AUTO_PICKUP_UNKNOWN =
  '09-29 14:00에 자동 픽업 완료 예정입니다. 매장이 숨김이면 자동으로 처리되지 않습니다.';

/** 매장·구매자 이름 조회 기본 응답. 테스트가 뒤에 등록한 핸들러가 이긴다 */
function useNameLookups() {
  server.use(
    gqlOk('AdminOrdersStoreName', {
      adminStore: { store: { id: '17', storeName: '달빛 케이크', isActive: true } },
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

  it('진행 중 칩은 첫 페이지부터 inProgress를 켜고 끄며 상태 필터에 7개 상태가 있다', async () => {
    const inputs: Record<string, unknown>[] = [];
    server.use(
      graphql.query('AdminOrders', ({ variables }) => {
        inputs.push((variables as { input: Record<string, unknown> }).input);
        return HttpResponse.json({
          data: {
            adminOrders: {
              items: [row('1', 'PENDING_PAYMENT'), row('2', 'NO_SHOW')],
              totalCount: 2,
              hasMore: false,
              nextCursor: null,
            },
          },
        });
      }),
    );
    boot('/orders?cursor=zzz');
    const table = await screen.findByRole('table');
    expect(await within(table).findByText('입금 대기')).toBeInTheDocument();
    expect(within(table).getByText('노쇼')).toBeInTheDocument();
    expect(inputs[0]).toMatchObject({ inProgress: false });
    const chip = screen.getByRole('button', { name: '진행 중' });
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(chip);
    await vi.waitFor(() => expect(inputs.at(-1)).toMatchObject({ inProgress: true, cursor: null }));
    expect(window.location.search).toContain('inProgress=true');
    expect(screen.getByRole('button', { name: '진행 중' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: '진행 중' }));
    await vi.waitFor(() => expect(inputs.at(-1)).toMatchObject({ inProgress: false }));
    expect(window.location.search).not.toContain('inProgress');

    await userEvent.click(screen.getByRole('combobox', { name: '주문 상태' }));
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      '전체',
      '입금 대기',
      '접수',
      '주문 확정',
      '제작 완료',
      '픽업 완료',
      '노쇼',
      '취소',
    ]);
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
        adminStore: { store: { id: '0', storeName: '달빛 베이커리', isActive: false } },
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

  it('구매자·상품·옵션·문구·이력을 보여주고 접수 주문은 사유를 골라 전액 환불로 취소한다', async () => {
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
                : {
                    ...canceledBy(48000),
                    statusHistories: [
                      {
                        id: 'h3',
                        fromStatus: 'SUBMITTED',
                        toStatus: 'CANCELED',
                        changedAt: '2026-09-27T03:00:00.000Z',
                        note: '재고 없음',
                        actorType: 'ADMIN',
                        cancelReason: 'OUT_OF_MATERIALS',
                        cancelFault: null,
                        refundAmount: 48000,
                      },
                      ...submitted.statusHistories,
                    ],
                  },
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
    expect(screen.queryByRole('button', { name: '픽업 완료' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '강제 취소' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: '강제 취소' });
    expect(confirm).toBeDisabled();
    // 접수 주문은 사정을 묻지 않는다
    expect(within(dialog).queryByRole('radio')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('status')).toHaveTextContent(
      '결제액 48,000원을 전액 환불합니다.',
    );
    await userEvent.click(within(dialog).getByRole('combobox', { name: '취소 사유' }));
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      '재료 소진',
      '구매자 요청',
      '기타',
    ]);
    await userEvent.click(screen.getByRole('option', { name: '재료 소진' }));
    await userEvent.type(within(dialog).getByLabelText('메모 (선택)'), '  재고 없음 🎂 ');
    expect(within(dialog).getByText('7 / 500')).toBeInTheDocument();
    await userEvent.click(confirm);
    await vi.waitFor(() =>
      expect(cancelInput).toEqual({
        orderId: '1',
        reason: 'OUT_OF_MATERIALS',
        note: '재고 없음 🎂',
      }),
    );
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText(/취소됨/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '강제 취소' })).not.toBeInTheDocument();
    expect(detailCalls).toBe(2);
    const canceled = within(history).getAllByRole('listitem')[0]!;
    expect(canceled).toHaveTextContent('관리자');
    expect(canceled).toHaveTextContent('사유 재료 소진 · 환불 48,000원');
  });

  it('확정 주문은 사정을 골라야 하고 구매자 사정이면 0원~결제액 금액을 받는다', async () => {
    const inputs: unknown[] = [];
    server.use(
      gqlOk('AdminOrder', { adminOrder: detail }),
      graphql.mutation('AdminCancelOrder', ({ variables }) => {
        inputs.push((variables as { input: unknown }).input);
        return HttpResponse.json({
          data: null,
          errors: [
            {
              message: '테스트는 다이얼로그를 남긴다',
              extensions: { code: 'TEST', classification: 'CONFLICT', statusCode: 409 },
            },
          ],
        });
      }),
    );
    boot('/orders/1');
    await userEvent.click(await screen.findByRole('button', { name: '강제 취소' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: '강제 취소' });
    await userEvent.click(within(dialog).getByRole('combobox', { name: '취소 사유' }));
    await userEvent.click(screen.getByRole('option', { name: '구매자 요청' }));
    expect(within(dialog).getByRole('status')).toHaveTextContent(
      '사정을 고르면 환불 금액이 정해집니다.',
    );
    expect(confirm).toBeDisabled();
    expect(within(dialog).queryByLabelText('환불 금액 (필수)')).not.toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('radio', { name: '판매자 사정' }));
    expect(within(dialog).queryByLabelText('환불 금액 (필수)')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('status')).toHaveTextContent(
      '판매자 사정이라 결제액 48,000원을 전액 환불합니다.',
    );
    await userEvent.click(confirm);
    await vi.waitFor(() =>
      expect(inputs.at(-1)).toEqual({
        orderId: '1',
        reason: 'BUYER_REQUEST',
        note: null,
        fault: 'SELLER',
      }),
    );
    // 입력 오류가 아닌 거절은 폼이 아니라 토스트로 알린다
    expect(await screen.findByText('테스트는 다이얼로그를 남긴다')).toBeInTheDocument();
    expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('radio', { name: '구매자 사정' }));
    const amount = within(dialog).getByLabelText('환불 금액 (필수)');
    expect(confirm).toBeDisabled();
    await userEvent.type(amount, '48001');
    expect(amount).toHaveAttribute('aria-invalid', 'true');
    expect(confirm).toBeDisabled();
    await userEvent.click(within(dialog).getByRole('button', { name: '전액' }));
    expect(amount).toHaveValue('48000');
    expect(amount).toHaveAttribute('aria-invalid', 'false');
    await userEvent.click(within(dialog).getByRole('button', { name: '0원' }));
    expect(amount).toHaveValue('0');
    expect(within(dialog).getByRole('status')).toHaveTextContent(
      '0원을 환불하고, 남은 48,000원은 수수료를 뺀 뒤 매장 정산에 포함합니다.',
    );
    // '0'도 금액이다
    await userEvent.click(confirm);
    await vi.waitFor(() =>
      expect(inputs.at(-1)).toEqual({
        orderId: '1',
        reason: 'BUYER_REQUEST',
        note: null,
        fault: 'BUYER',
        refundAmount: 0,
      }),
    );
    expect(inputs).toHaveLength(2);
  });

  it('입금 대기 주문은 미입금 사유로 환불 없이 취소하고 입금 기한을 안내한다', async () => {
    let cancelInput: unknown;
    server.use(
      gqlOk('AdminOrder', { adminOrder: pendingPayment }),
      graphql.mutation('AdminCancelOrder', ({ variables }) => {
        cancelInput = (variables as { input: unknown }).input;
        return HttpResponse.json({ data: { adminCancelOrder: { id: '1', status: 'CANCELED' } } });
      }),
    );
    boot('/orders/1');
    expect(await screen.findByRole('note', { name: '자동 처리 예정' })).toHaveTextContent(
      '09-27 12:10까지 입금이 확인되지 않으면 자동 취소됩니다.',
    );
    const progress = screen.getByText('진행 상태').closest<HTMLElement>('[data-slot="card"]')!;
    expect(within(progress).getAllByRole('listitem')[0]).toHaveTextContent('입금 대기09-27 11:20');
    await userEvent.click(screen.getByRole('button', { name: '강제 취소' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('status')).toHaveTextContent(
      '입금 전 주문이라 환불 없이 취소합니다.',
    );
    await userEvent.click(within(dialog).getByRole('combobox', { name: '취소 사유' }));
    await userEvent.click(screen.getByRole('option', { name: '미입금' }));
    await userEvent.click(within(dialog).getByRole('button', { name: '강제 취소' }));
    await vi.waitFor(() =>
      expect(cancelInput).toEqual({ orderId: '1', reason: 'PAYMENT_NOT_RECEIVED', note: null }),
    );
  });

  it.each([
    ['PICKED_UP', '픽업 완료'],
    ['NO_SHOW', '노쇼'],
  ])('%s처럼 취소할 수 없는 주문은 강제 취소·픽업 완료 버튼이 없다', async (status, label) => {
    server.use(
      gqlOk('AdminOrder', {
        adminOrder: {
          ...detail,
          status,
          noShowAt: status === 'NO_SHOW' ? '2026-09-28T06:00:00.000Z' : null,
          autoPickupAt: null,
          cancelOptions: { cancelable: false, reasons: [], refundRule: null, paidAmount: 48000 },
        },
      }),
    );
    boot('/orders/1');
    await screen.findByText('레터링 생크림 케이크');
    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: '강제 취소' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '픽업 완료' })).not.toBeInTheDocument();
    if (status === 'NO_SHOW')
      expect(screen.getByText('노쇼 · 2026-09-28 15:00')).toBeInTheDocument();
  });

  it.each(['CONFIRMED', 'MADE'])(
    '%s 주문은 메모와 함께 픽업 완료로 처리하고 상세·목록을 갱신한다',
    async (status) => {
      let detailCalls = 0;
      let pickupInput: unknown;
      server.use(
        graphql.query('AdminOrder', () => {
          detailCalls += 1;
          return HttpResponse.json({
            data: {
              adminOrder:
                detailCalls === 1
                  ? { ...detail, status }
                  : {
                      ...detail,
                      status: 'PICKED_UP',
                      pickedUpAt: '2026-09-28T06:00:00.000Z',
                      autoPickupAt: null,
                      cancelOptions: { ...detail.cancelOptions, cancelable: false },
                    },
            },
          });
        }),
        graphql.mutation('AdminCompleteOrderPickup', ({ variables }) => {
          pickupInput = (variables as { input: unknown }).input;
          return HttpResponse.json({
            data: { adminCompleteOrderPickup: { id: '1', status: 'PICKED_UP' } },
          });
        }),
      );
      boot('/orders/1');
      // 숨김 매장 진행 주문에서 강제 취소와 나란히 쓴다
      expect(await screen.findByRole('button', { name: '강제 취소' })).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: '픽업 완료' }));
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText(/정산을 확정합니다/)).toBeInTheDocument();
      await userEvent.type(
        within(dialog).getByLabelText('메모 (선택)'),
        '매장 숨김, 전화로 수령 확인',
      );
      await userEvent.click(within(dialog).getByRole('button', { name: '픽업 완료' }));
      await vi.waitFor(() =>
        expect(pickupInput).toEqual({ orderId: '1', note: '매장 숨김, 전화로 수령 확인' }),
      );
      await vi.waitFor(() => expect(detailCalls).toBe(2));
      await vi.waitFor(() =>
        expect(screen.queryByRole('button', { name: '픽업 완료' })).not.toBeInTheDocument(),
      );
      // 앞 케이스의 토스트가 남아 있을 수 있다
      expect(await screen.findAllByText(/픽업 완료로 처리했습니다/)).not.toHaveLength(0);
    },
  );

  it.each([
    ['ORDER_STATUS_UNCHANGED', '이미 픽업 완료된 주문입니다.'],
    ['INVALID_ORDER_STATUS_TRANSITION', '지금 상태에서는 픽업 완료로 처리할 수 없습니다.'],
    ['ORDER_NOT_FOUND', '주문을 찾을 수 없습니다.'],
  ])('픽업 완료가 %s로 거절되면 문구를 알리고 상세를 다시 불러온다', async (code, message) => {
    let detailCalls = 0;
    let pickupInput: unknown;
    server.use(
      graphql.query('AdminOrder', () => {
        detailCalls += 1;
        return HttpResponse.json({ data: { adminOrder: detail } });
      }),
      graphql.mutation('AdminCompleteOrderPickup', ({ variables }) => {
        pickupInput = (variables as { input: unknown }).input;
        return HttpResponse.json({
          data: null,
          errors: [
            {
              message: '주문을 찾을 수 없습니다.',
              extensions: {
                code,
                classification: code === 'ORDER_NOT_FOUND' ? 'NOT_FOUND' : 'BAD_USER_INPUT',
                statusCode: code === 'ORDER_NOT_FOUND' ? 404 : 400,
              },
            },
          ],
        });
      }),
    );
    boot('/orders/1');
    await userEvent.click(await screen.findByRole('button', { name: '픽업 완료' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: '픽업 완료' }));
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(pickupInput).toEqual({ orderId: '1', note: null });
    await vi.waitFor(() => expect(detailCalls).toBe(2));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('결제·정산 카드와 자동 픽업 완료 예정을 보이고 입금 계좌는 끝 4자리만 보인다', async () => {
    server.use(gqlOk('AdminOrder', { adminOrder: detail }));
    boot('/orders/1');
    const card = (title: string) =>
      screen
        .getAllByText(title)
        .find((el) => el.dataset.slot === 'card-title')!
        .closest<HTMLElement>('[data-slot="card"]')!;
    await screen.findByText('레터링 생크림 케이크');
    const pay = card('결제');
    expect(within(pay).getByText('계좌이체')).toBeInTheDocument();
    expect(within(pay).getByText('입금 확인')).toBeInTheDocument();
    expect(within(pay).getByText('우리은행 ****6789 · 케이퀵')).toBeInTheDocument();
    expect(pay).not.toHaveTextContent('1002123456789');
    expect(
      within(pay).getByText('2026-09-27 11:20 · 관리자 확인 · 운영자(ops.admin)'),
    ).toBeInTheDocument();
    expect(within(pay).queryByText('확인 메모')).not.toBeInTheDocument();
    const settle = card('정산');
    expect(within(settle).getByText('10% (주문 시점)')).toBeInTheDocument();
    expect(within(settle).getByText('정산 예정')).toBeInTheDocument();
    expect(within(settle).getByText('43,200원')).toBeInTheDocument();
    expect(within(settle).getByText('묶이기 전')).toBeInTheDocument();
    expect(within(settle).queryByText('수수료')).not.toBeInTheDocument();
    await vi.waitFor(() =>
      expect(screen.getByRole('note', { name: '자동 처리 예정' })).toHaveTextContent(
        '09-29 14:00에 자동으로 픽업 완료됩니다.',
      ),
    );
    expect(screen.queryByText('요청 사항')).not.toBeInTheDocument();
    expect(screen.queryByText('픽업 일시 변경')).not.toBeInTheDocument();
    expect(screen.queryByText('환불')).not.toBeInTheDocument();
  });

  it('숨김 매장의 확정 주문은 자동 픽업 완료되지 않는다고 알린다', async () => {
    server.use(
      gqlOk('AdminOrder', { adminOrder: detail }),
      gqlOk('AdminOrdersStoreName', {
        adminStore: { store: { id: '17', storeName: '달빛 케이크', isActive: false } },
      }),
    );
    boot('/orders/1');
    await vi.waitFor(() =>
      expect(screen.getByRole('note', { name: '자동 처리 예정' })).toHaveTextContent(
        '매장이 숨김이라 09-29 14:00에 자동 픽업 완료되지 않습니다. 픽업 완료나 강제 취소로 직접 처리하세요.',
      ),
    );
  });

  it('매장 조회가 끝나기 전에는 자동 픽업 완료를 단정하지 않는다', async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    server.use(
      gqlOk('AdminOrder', { adminOrder: detail }),
      graphql.query('AdminOrdersStoreName', async () => {
        await gate;
        return HttpResponse.json({
          data: { adminStore: { store: { id: '17', storeName: '달빛 케이크', isActive: false } } },
        });
      }),
    );
    boot('/orders/1');
    const note = await screen.findByRole('note', { name: '자동 처리 예정' });
    expect(note).toHaveTextContent(AUTO_PICKUP_UNKNOWN);
    release();
    await vi.waitFor(() => expect(note).toHaveTextContent(/^매장이 숨김이라/));
  });

  it('상세를 다시 열면 매장 숨김 여부를 다시 확인한다', async () => {
    server.use(
      gqlOk('AdminOrder', { adminOrder: detail }),
      gqlOk('AdminOrders', {
        adminOrders: { items: [row('1')], totalCount: 1, hasMore: false, nextCursor: null },
      }),
    );
    boot('/orders/1');
    const note = () => screen.getByRole('note', { name: '자동 처리 예정' });
    await vi.waitFor(() =>
      expect(note()).toHaveTextContent('09-29 14:00에 자동으로 픽업 완료됩니다.'),
    );
    // 그사이 매장 화면에서 숨겼다
    server.use(
      gqlOk('AdminOrdersStoreName', {
        adminStore: { store: { id: '17', storeName: '달빛 케이크', isActive: false } },
      }),
    );
    await userEvent.click(screen.getByRole('link', { name: '목록으로' }));
    await userEvent.click(await screen.findByRole('link', { name: 'CQ-2609-1' }));
    await vi.waitFor(() => expect(note()).toHaveTextContent(/^매장이 숨김이라/));
  });

  it('취소 주문은 취소·환불 카드와 확정된 정산을, 요청 사항·픽업 변경 이력을 보인다', async () => {
    server.use(
      gqlOk('AdminOrder', {
        adminOrder: {
          ...canceledBy(10000),
          requestNote: '초는 빼 주세요.\n포장은 따로',
          refunds: [
            {
              id: 'r1',
              kind: 'CANCEL',
              amount: 10000,
              status: 'AWAITING_ACCOUNT',
              bank: null,
              accountHolder: null,
              accountNumberMasked: null,
              requestedAt: '2026-09-27T03:00:00.000Z',
              accountSubmittedAt: null,
              completedAt: null,
            },
            {
              id: 'r2',
              kind: 'DEPOSIT_RETURN',
              amount: 5000,
              status: 'COMPLETED',
              bank: { code: '004', name: 'KB국민은행' },
              accountHolder: '김서연',
              accountNumberMasked: '****4321',
              requestedAt: '2026-09-27T04:00:00.000Z',
              accountSubmittedAt: '2026-09-27T05:00:00.000Z',
              completedAt: '2026-09-27T06:00:00.000Z',
            },
          ],
          pickupChanges: [
            {
              id: 'p1',
              fromPickupAt: '2026-09-28T03:00:00.000Z',
              toPickupAt: '2026-09-28T05:00:00.000Z',
              changedAt: '2026-09-27T02:40:00.000Z',
              note: '오전 재료 입고 지연',
            },
          ],
          expectedPayoutAmount: 34200,
          settlementBaseAmount: 38000,
          commissionAmount: 3800,
          settlementFinalizedAt: '2026-09-27T03:00:00.000Z',
          settlementId: '12',
        },
      }),
    );
    boot('/orders/1');
    const card = (title: string) =>
      screen
        .getAllByText(title)
        .find((el) => el.dataset.slot === 'card-title')!
        .closest<HTMLElement>('[data-slot="card"]')!;
    await screen.findByText('취소됨 · 2026-09-27 12:00');
    expect(screen.queryByRole('note', { name: '자동 처리 예정' })).not.toBeInTheDocument();
    const cancel = card('취소');
    for (const text of [
      '주체관리자',
      '사유구매자 요청',
      '사정구매자 사정',
      '환불 금액10,000원계좌 입력 대기',
      '메모구매자가 전화로 요청',
    ])
      expect(cancel).toHaveTextContent(text);
    const [first, second] = within(card('환불')).getAllByRole('listitem');
    expect(first).toHaveTextContent('취소 환불10,000원계좌 입력 대기');
    expect(first).toHaveTextContent('환불 계좌 입력 전');
    expect(second).toHaveTextContent('입금 반환5,000원송금 완료');
    expect(second).toHaveTextContent('KB국민은행 ****4321 · 김서연');
    expect(second).toHaveTextContent(
      '요청 2026-09-27 13:00 · 계좌 입력 2026-09-27 14:00 · 송금 2026-09-27 15:00',
    );
    const settle = card('정산');
    for (const text of ['매장 지급액', '34,200원', '38,000원', '3,800원', '#12'])
      expect(within(settle).getByText(text)).toBeInTheDocument();
    expect(within(card('요청 사항')).getByText(/초는 빼 주세요/)).toHaveClass(
      'whitespace-pre-wrap',
    );
    expect(within(card('픽업 일시 변경')).getByRole('listitem')).toHaveTextContent(
      '2026-09-28 12:00 → 2026-09-28 14:00변경 2026-09-27 11:40오전 재료 입고 지연',
    );
  });

  it('결제 도입 전 주문은 결제 기록이 없다고 알리고 진행 단계는 접수부터 보인다', async () => {
    server.use(
      gqlOk('AdminOrder', {
        adminOrder: { ...detail, payment: null, expectedPayoutAmount: null },
      }),
    );
    boot('/orders/1');
    expect(
      await screen.findByText('결제 도입 전 주문이라 결제 기록이 없습니다.'),
    ).toBeInTheDocument();
    const progress = screen.getByText('진행 상태').closest<HTMLElement>('[data-slot="card"]')!;
    expect(
      within(progress)
        .getAllByRole('listitem')
        .map((li) => li.textContent?.slice(0, 2)),
    ).toEqual(['접수', '주문', '제작', '픽업']);
  });
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

  it('선택지 밖 사유로 거절되면 폼 위에 알리고 다시 받은 선택지에 맞춰 사유를 비운다', async () => {
    let detailCalls = 0;
    server.use(
      graphql.query('AdminOrder', () => {
        detailCalls += 1;
        // 그사이 다른 관리자가 입금을 확인해 접수가 됐다
        return HttpResponse.json({
          data: { adminOrder: detailCalls === 1 ? pendingPayment : submitted },
        });
      }),
      gqlError('AdminCancelOrder', {
        message: '이 주문에는 선택할 수 없는 취소 사유입니다.',
        code: 'CANCEL_REASON_NOT_ALLOWED',
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
    );
    boot('/orders/1');
    await userEvent.click(await screen.findByRole('button', { name: '강제 취소' }));
    const dialog = await screen.findByRole('dialog');
    const reason = () => within(dialog).getByRole('combobox', { name: '취소 사유' });
    await userEvent.click(reason());
    await userEvent.click(screen.getByRole('option', { name: '미입금' }));
    await userEvent.type(within(dialog).getByLabelText('메모 (선택)'), '입금 안 됨');
    await userEvent.click(within(dialog).getByRole('button', { name: '강제 취소' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      '이 주문에는 선택할 수 없는 취소 사유입니다.',
    );
    await vi.waitFor(() =>
      expect(within(dialog).getByRole('status')).toHaveTextContent(
        '결제액 48,000원을 전액 환불합니다.',
      ),
    );
    expect(detailCalls).toBe(2);
    expect(reason()).toHaveTextContent('사유 선택');
    expect(within(dialog).getByRole('button', { name: '강제 취소' })).toBeDisabled();

    // 입력을 바꾸면 알림을 지운다
    await userEvent.click(reason());
    await userEvent.click(screen.getByRole('option', { name: '기타' }));
    expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '강제 취소' })).toBeEnabled();

    // 닫았다 다시 열면 새로 입력받는다
    const footer = dialog.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
    await userEvent.click(within(footer).getByRole('button', { name: '닫기' }));
    await userEvent.click(screen.getByRole('button', { name: '강제 취소' }));
    const reopened = await screen.findByRole('dialog');
    expect(within(reopened).getByRole('combobox', { name: '취소 사유' })).toHaveTextContent(
      '사유 선택',
    );
    expect(within(reopened).getByLabelText('메모 (선택)')).toHaveValue('');
  });

  it('취소할 수 없게 된 주문은 토스트로 알리고 다이얼로그는 버튼과 함께 사라진다', async () => {
    let detailCalls = 0;
    server.use(
      graphql.query('AdminOrder', () => {
        detailCalls += 1;
        return HttpResponse.json({
          data: { adminOrder: detailCalls === 1 ? submitted : canceledBy(48000) },
        });
      }),
      gqlError('AdminCancelOrder', {
        message: '현재 상태에서는 주문을 취소할 수 없습니다.',
        code: 'ORDER_NOT_CANCELLABLE',
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
    );
    boot('/orders/1');
    await userEvent.click(await screen.findByRole('button', { name: '강제 취소' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('combobox', { name: '취소 사유' }));
    await userEvent.click(screen.getByRole('option', { name: '기타' }));
    await userEvent.click(within(dialog).getByRole('button', { name: '강제 취소' }));
    expect(
      await screen.findByText('현재 상태에서는 주문을 취소할 수 없습니다.'),
    ).toBeInTheDocument();
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: '강제 취소' })).not.toBeInTheDocument();
    expect(detailCalls).toBe(2);
  });

  it('픽업 완료 메모는 BE처럼 앞뒤 공백을 뺀 코드 포인트로 500자까지 받는다', async () => {
    server.use(gqlOk('AdminOrder', { adminOrder: detail }));
    boot('/orders/1');
    await userEvent.click(await screen.findByRole('button', { name: '픽업 완료' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: '픽업 완료' });
    await userEvent.click(within(dialog).getByLabelText('메모 (선택)'));
    await userEvent.paste(` ${'🎂'.repeat(500)}`);
    expect(within(dialog).getByText('500 / 500')).toBeInTheDocument();
    expect(confirm).toBeEnabled();
    await userEvent.paste('🎂');
    expect(within(dialog).getByText('501 / 500')).toBeInTheDocument();
    expect(confirm).toBeDisabled();
  });

  /** 목록 → 상세에서 처리한 뒤 '목록으로' 돌아갈 때까지 목록 조회 횟수 */
  async function listCallsAfter(handle: () => Promise<void>) {
    let listCalls = 0;
    server.use(
      graphql.query('AdminOrders', () => {
        listCalls += 1;
        return HttpResponse.json({
          data: {
            adminOrders: { items: [row('1')], totalCount: 1, hasMore: false, nextCursor: null },
          },
        });
      }),
    );
    boot('/orders');
    await userEvent.click(await screen.findByRole('link', { name: 'CQ-2609-1' }));
    await handle();
    expect(listCalls).toBe(1);
    await userEvent.click(screen.getByRole('link', { name: '목록으로' }));
    await screen.findByText('전체 1건');
    return () => listCalls;
  }

  it('강제 취소가 성공하면 목록으로 돌아갈 때 목록을 다시 불러온다', async () => {
    server.use(
      gqlOk('AdminOrder', { adminOrder: submitted }),
      graphql.mutation('AdminCancelOrder', () =>
        HttpResponse.json({ data: { adminCancelOrder: { id: '1', status: 'CANCELED' } } }),
      ),
    );
    const listCalls = await listCallsAfter(async () => {
      await userEvent.click(await screen.findByRole('button', { name: '강제 취소' }));
      const dialog = await screen.findByRole('dialog');
      await userEvent.click(within(dialog).getByRole('combobox', { name: '취소 사유' }));
      await userEvent.click(screen.getByRole('option', { name: '기타' }));
      await userEvent.click(within(dialog).getByRole('button', { name: '강제 취소' }));
      await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });
    await vi.waitFor(() => expect(listCalls()).toBe(2));
  });

  it('픽업 완료가 거절돼도 목록으로 돌아갈 때 목록을 다시 불러온다', async () => {
    server.use(
      gqlOk('AdminOrder', { adminOrder: detail }),
      gqlError('AdminCompleteOrderPickup', {
        message: '허용되지 않는 주문 상태 전이입니다.',
        code: 'INVALID_ORDER_STATUS_TRANSITION',
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
    );
    const listCalls = await listCallsAfter(async () => {
      await userEvent.click(await screen.findByRole('button', { name: '픽업 완료' }));
      const dialog = await screen.findByRole('dialog');
      await userEvent.click(within(dialog).getByRole('button', { name: '픽업 완료' }));
      // 앞 케이스의 토스트가 남아 있을 수 있다
      expect(
        await screen.findAllByText('지금 상태에서는 픽업 완료로 처리할 수 없습니다.'),
      ).not.toHaveLength(0);
      await userEvent.keyboard('{Escape}');
    });
    await vi.waitFor(() => expect(listCalls()).toBe(2));
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
