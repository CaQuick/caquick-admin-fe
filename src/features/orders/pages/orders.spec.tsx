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
const row = (id: string, status = 'CONFIRMED') => ({
  id,
  orderNumber: `CQ-2609-${id}`,
  accountId: '10',
  storeId: '17',
  status,
  pickupAt: '2026-09-28T05:00:00.000Z',
  buyerName: '김서연',
  buyerPhone: '010-4321-1182',
  totalPrice: 48000,
  createdAt: '2026-09-27T02:20:00.000Z',
});
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
      customTexts: [
        {
          id: 'c1',
          tokenKey: 'msg',
          defaultText: '축하해',
          valueText: '서연아 생일 축하해',
          sortOrder: 0,
        },
      ],
      freeEdits: [
        {
          id: 'f1',
          cropImageUrl: 'https://img.test/crop.png',
          descriptionText: '왼쪽 위에 배치',
          sortOrder: 0,
          attachments: [{ id: 'a1', imageUrl: 'https://img.test/a.png', sortOrder: 0 }],
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
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );

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

  it('숫자가 아닌 ID 입력은 커밋하지 않고 알린다', async () => {
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
    boot('/orders');
    await screen.findByText('CQ-2609-1');
    const storeInput = screen.getByRole('textbox', { name: '매장 ID' });
    expect(storeInput).toHaveAttribute('inputMode', 'numeric');

    await userEvent.type(storeInput, '17a');
    await userEvent.tab();
    expect(screen.getByRole('alert')).toHaveTextContent('숫자만 입력해 주세요.');
    expect(storeInput).toHaveValue('17a');
    expect(storeInput).toHaveAttribute('aria-invalid', 'true');
    expect(window.location.search).not.toContain('storeId');

    await userEvent.type(storeInput, '{backspace}');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await userEvent.tab();
    await vi.waitFor(() => expect(inputs.at(-1)).toMatchObject({ storeId: '17' }));
    expect(inputs.every((i) => i.storeId === null || i.storeId === '17')).toBe(true);
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
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );

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
                ? detail
                : { ...detail, status: 'CANCELED', canceledAt: '2026-09-27T03:00:00.000Z' },
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
    expect(screen.getByText('맛: 얼그레이')).toBeInTheDocument();
    expect(screen.getByText(/서연아 생일 축하해/)).toBeInTheDocument();
    expect(screen.getByText('seoyeon')).toBeInTheDocument();
    const history = screen.getByText('상태 이력').closest<HTMLElement>('[data-slot="card"]')!;
    expect(within(history).getAllByRole('listitem')).toHaveLength(2);

    await userEvent.click(screen.getByRole('button', { name: '주문 취소' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: '주문 취소' });
    expect(confirm).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText('취소 사유 (필수)'), '  재고 없음  ');
    await userEvent.click(confirm);
    await vi.waitFor(() => expect(cancelInput).toEqual({ orderId: '1', note: '재고 없음' }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText(/취소됨/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '주문 취소' })).not.toBeInTheDocument();
    expect(detailCalls).toBe(2);
  });

  it('취소 실패는 토스트로 알리고 다이얼로그는 남는다', async () => {
    server.use(
      gqlOk('AdminOrder', { adminOrder: detail }),
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
