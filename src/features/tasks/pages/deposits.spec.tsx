import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, graphql } from 'msw';

import { App } from '@/app/app';
import { useAuthStore } from '@/features/auth';
import { forgetSearches } from '@/shared/lib/list-return';
import { formatKst } from '@/shared/lib/kst';
import { gqlError, gqlOk, restError, restOk } from '@/test/msw/graphql';
import { server } from '@/test/msw/server';

import { type DepositRecord, type PendingPayment, type TaskOrder } from '../api/queries';

const me = {
  accountId: '1',
  username: 'ops.admin',
  email: null,
  name: '운영',
  status: 'ACTIVE',
  mustChangePassword: false,
  lastLoginAt: null,
  createdAt: '2026-09-27T00:00:00.000Z',
};
const session = {
  accessToken: 'at',
  tokenType: 'Bearer',
  accountStatus: 'ACTIVE',
  mustChangePassword: false,
};

const H = 3600_000;
const at = (ms: number) => new Date(Date.now() + ms).toISOString();

const order = (id: string, over: Partial<TaskOrder> = {}): TaskOrder => ({
  id,
  orderNumber: `CQ-${id}`,
  status: 'PENDING_PAYMENT',
  pickupAt: at(48 * H),
  buyerName: '김구매',
  buyerPhone: '010-1234-5678',
  totalPrice: 30000,
  createdAt: at(-30 * 60_000),
  items: [{ id: `i${id}`, productName: '레터링 케이크' }],
  payment: {
    status: 'PENDING',
    amount: 30000,
    depositorName: '김입금',
    expiresAt: at(30 * 60_000),
    buyerClaimedAt: at(-60_000),
    confirmedAt: null,
    confirmedByLabel: null,
    confirmNote: null,
  },
  cancellation: null,
  ...over,
});

const row = (o: TaskOrder, over: Partial<PendingPayment> = {}): PendingPayment => ({
  orderId: o.id,
  orderNumber: o.orderNumber,
  storeName: '루미 케이크',
  productName: '레터링 케이크',
  amount: o.payment!.amount,
  depositorName: o.payment!.depositorName,
  buyerName: o.buyerName,
  buyerPhone: o.buyerPhone,
  createdAt: o.createdAt,
  expiresAt: o.payment!.expiresAt,
  buyerClaimedAt: o.payment!.buyerClaimedAt ?? null,
  pickupAt: o.pickupAt,
  ...over,
});

/** 입금 대기 주문을 들고 있는 가짜 BE. 처리하면 목록에서 빠진다 */
function backend(initial: TaskOrder[]) {
  const orders = new Map(initial.map((o) => [o.id, o]));
  const calls = { list: [] as Record<string, unknown>[], counts: 0, order: [] as string[] };
  server.use(
    restOk('/admin/refresh', session),
    gqlOk('AdminMe', { adminMe: me }),
    graphql.query('AdminTaskCounts', () => {
      calls.counts += 1;
      const pending = [...orders.values()].filter((o) => o.status === 'PENDING_PAYMENT');
      return HttpResponse.json({
        data: {
          adminTaskCounts: {
            claimedPayments: pending.filter((o) => o.payment?.buyerClaimedAt).length,
            pendingPayments: pending.length,
            refundsAwaitingAccount: 0,
            refundsAwaitingTransfer: 0,
            pendingSettlements: 0,
          },
        },
      });
    }),
    graphql.query('AdminTasksPendingPayments', ({ variables }) => {
      const input = (variables as { input: Record<string, unknown> }).input;
      calls.list.push(input);
      const items = [...orders.values()]
        .filter((o) => o.status === 'PENDING_PAYMENT')
        .filter((o) => !input.claimedOnly || o.payment?.buyerClaimedAt)
        .map((o) => row(o));
      return HttpResponse.json({
        data: {
          adminPendingPayments: {
            items,
            totalCount: items.length,
            hasMore: false,
            nextCursor: null,
          },
        },
      });
    }),
    graphql.query('AdminTasksOrder', ({ variables }) => {
      const { orderId } = variables as { orderId: string };
      calls.order.push(orderId);
      const o = orders.get(orderId);
      return o
        ? HttpResponse.json({ data: { adminOrder: o } })
        : HttpResponse.json({
            data: null,
            errors: [
              {
                message: '주문을 찾을 수 없습니다.',
                extensions: {
                  code: 'ORDER_NOT_FOUND',
                  classification: 'NOT_FOUND',
                  statusCode: 404,
                },
              },
            ],
          });
    }),
  );
  return { orders, calls };
}

function boot(path: string) {
  window.history.pushState({}, '', path);
  render(<App />);
}

const sheet = (name: RegExp) => screen.findByRole('dialog', { name });
const query = () => new URLSearchParams(window.location.search);

describe('처리 대기 — 입금', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false });
    forgetSearches();
  });

  it('딥링크 주문을 시트로 열어 입금을 확인하고 처리됨과 다음 건으로 넘어간다', async () => {
    const { orders, calls } = backend([order('12'), order('13')]);
    let confirmInput: unknown;
    server.use(
      graphql.mutation('AdminTasksConfirmPayment', ({ variables }) => {
        confirmInput = (variables as { input: unknown }).input;
        const o = orders.get('12')!;
        orders.set('12', {
          ...o,
          status: 'SUBMITTED',
          payment: {
            ...o.payment!,
            status: 'CONFIRMED',
            confirmedAt: '2026-11-19T01:00:00.000Z',
            confirmedByLabel: '운영(ops.admin)',
          },
        });
        return HttpResponse.json({
          data: { adminConfirmPayment: { id: '12', status: 'SUBMITTED' } },
        });
      }),
    );
    boot('/tasks/deposits?orderId=12');
    const s = await sheet(/주문 CQ-12/);
    expect(s).toHaveTextContent('은행 앱에서 입금자명과 금액을 확인한 뒤 입금액을 입력하세요.');
    expect(s).toHaveTextContent('김입금');
    expect(s).toHaveTextContent('30,000원');
    expect(within(s).getByRole('link', { name: '주문 화면에서 보기' })).toHaveAttribute(
      'href',
      '/orders/12',
    );
    const countsBefore = calls.counts;

    await userEvent.type(within(s).getByLabelText('입금액(원) (필수)'), '30,000');
    await userEvent.click(within(s).getByRole('button', { name: '입금 확인' }));

    expect(confirmInput).toEqual({ orderId: '12', depositedAmount: 30000, note: null });
    expect(
      await screen.findByText('CQ-12 입금을 확인했습니다. 판매자에게 새 주문으로 보입니다.'),
    ).toBeInTheDocument();
    const done = await within(s).findByRole('status');
    expect(done).toHaveTextContent('처리됨');
    expect(done).toHaveTextContent(
      `입금 확인 · 운영(ops.admin) · ${formatKst('2026-11-19T01:00:00.000Z', true)}`,
    );
    expect(within(s).queryByRole('button', { name: '미입금 취소' })).not.toBeInTheDocument();
    // 처리하면 건수도 다시 읽는다
    expect(calls.counts).toBeGreaterThan(countsBefore);

    await userEvent.click(within(s).getByRole('button', { name: '다음 건 (1건 남음)' }));
    await vi.waitFor(() => expect(query().get('orderId')).toBe('13'));
    expect(await sheet(/주문 CQ-13/)).toBeInTheDocument();
  });

  it('그사이 다른 관리자가 처리했으면(409) 토스트를 보이고 다시 읽어 처리자·시각을 보인다', async () => {
    const { orders } = backend([order('12')]);
    server.use(
      graphql.mutation('AdminTasksConfirmPayment', () => {
        const o = orders.get('12')!;
        orders.set('12', {
          ...o,
          status: 'SUBMITTED',
          payment: {
            ...o.payment!,
            status: 'CONFIRMED',
            confirmedAt: '2026-11-19T00:59:00.000Z',
            confirmedByLabel: '김관리(kim)',
          },
        });
        return HttpResponse.json({
          data: null,
          errors: [
            {
              message: '입금 대기 중인 주문이 아닙니다. 이미 처리됐는지 확인해 주세요.',
              extensions: {
                code: 'PAYMENT_NOT_PENDING',
                classification: 'CONFLICT',
                statusCode: 409,
              },
            },
          ],
        });
      }),
    );
    boot('/tasks/deposits?orderId=12');
    const s = await sheet(/주문 CQ-12/);
    await userEvent.type(within(s).getByLabelText('입금액(원) (필수)'), '30000');
    await userEvent.click(within(s).getByRole('button', { name: '입금 확인' }));
    expect(
      await screen.findByText('입금 대기 중인 주문이 아닙니다. 이미 처리됐는지 확인해 주세요.'),
    ).toBeInTheDocument();
    expect(await within(s).findByRole('status')).toHaveTextContent(
      `입금 확인 · 김관리(kim) · ${formatKst('2026-11-19T00:59:00.000Z', true)}`,
    );
    // 목록에 남은 건이 없다
    expect(within(s).getByText('남은 건이 없습니다.')).toBeInTheDocument();
  });

  it('화면은 픽업 전이어도 서버가 픽업 지남(409)으로 거절하면 확인 폼을 안내로 바꾼다', async () => {
    const { orders } = backend([order('12', { pickupAt: at(60_000) })]);
    let confirms = 0;
    server.use(
      graphql.mutation('AdminTasksConfirmPayment', () => {
        confirms += 1;
        return HttpResponse.json({
          data: null,
          errors: [
            {
              message:
                '픽업 시각이 지난 주문은 입금 확인할 수 없어요. 미입금 취소 뒤 반환 대상으로 연결해 주세요.',
              extensions: {
                code: 'PAYMENT_PICKUP_PASSED',
                classification: 'CONFLICT',
                statusCode: 409,
              },
            },
          ],
        });
      }),
    );
    boot('/tasks/deposits?orderId=12');
    const s = await sheet(/주문 CQ-12/);
    expect(within(s).getByText('3시간 미만')).toBeInTheDocument();
    await userEvent.type(within(s).getByLabelText('입금액(원) (필수)'), '30000');
    await userEvent.click(within(s).getByRole('button', { name: '입금 확인' }));

    expect(await within(s).findByRole('note')).toHaveTextContent(
      '픽업 시각이 지난 주문은 입금 확인할 수 없어요. 미입금 취소 뒤 반환 대상으로 연결해 주세요.',
    );
    expect(within(s).getByText('픽업 지남')).toBeInTheDocument();
    expect(within(s).queryByRole('form', { name: '입금 확인' })).not.toBeInTheDocument();
    expect(within(s).getByRole('button', { name: '미입금 취소' })).toBeInTheDocument();
    expect(confirms).toBe(1);
    // 다시 읽은 주문은 여전히 입금 대기다
    expect(orders.get('12')!.status).toBe('PENDING_PAYMENT');
  });

  it('입금액이 결제 금액과 다르면 오류 문구와 함께 반환 연결을 입력한 금액으로 미리 채워 연다', async () => {
    backend([order('12')]);
    let returnInput: unknown;
    server.use(
      gqlError('AdminTasksConfirmPayment', {
        message: '입금액이 결제 금액과 달라 입금 확인할 수 없어요. 반환 대상으로 연결해 주세요.',
        code: 'DEPOSIT_AMOUNT_MISMATCH',
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
      graphql.mutation('AdminTasksCreateDepositReturn', ({ variables }) => {
        returnInput = (variables as { input: unknown }).input;
        return HttpResponse.json({
          data: { adminCreateDepositReturn: { id: '40', refundId: '41' } },
        });
      }),
    );
    boot('/tasks/deposits?orderId=12');
    const s = await sheet(/주문 CQ-12/);
    await userEvent.type(within(s).getByLabelText('입금액(원) (필수)'), '29,000');
    await userEvent.click(within(s).getByRole('button', { name: '입금 확인' }));

    const dialog = await screen.findByRole('dialog', { name: '반환 대상으로 연결' });
    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      '입금액이 결제 금액과 달라 입금 확인할 수 없어요. 반환 대상으로 연결해 주세요.',
    );
    expect(within(dialog).getByLabelText('입금액(원) (필수)')).toHaveValue('29000');
    expect(within(dialog).getByLabelText('입금자명 (필수)')).toHaveValue('김입금');
    await userEvent.type(within(dialog).getByLabelText('메모 (선택)'), '금액 틀린 입금');
    await userEvent.click(within(dialog).getByRole('button', { name: '반환 대상으로 연결' }));
    await vi.waitFor(() =>
      expect(returnInput).toEqual({
        orderId: '12',
        amount: 29000,
        depositorName: '김입금',
        depositedAt: null,
        note: '금액 틀린 입금',
      }),
    );
    expect(
      await screen.findByText(
        '반환 대상으로 연결했습니다. 구매자에게 환불 계좌 입력을 요청했어요.',
      ),
    ).toBeInTheDocument();
    await vi.waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '반환 대상으로 연결' })).not.toBeInTheDocument(),
    );
    // 반환을 연결해도 주문은 입금 대기 그대로라 확인 폼이 남는다
    expect(within(s).getByRole('alert')).toHaveTextContent('입금액이 결제 금액과 달라');
    await userEvent.click(within(s).getByRole('link', { name: '환불 #41 보기' }));
    await vi.waitFor(() => expect(window.location.pathname).toBe('/tasks/refunds'));
    expect(query().get('refundId')).toBe('41');
  });

  it('입금액 칸은 숫자만 받고 서버의 입금액 오류는 칸 아래에 보인다', async () => {
    backend([order('12')]);
    let calls = 0;
    server.use(
      graphql.mutation('AdminTasksConfirmPayment', () => {
        calls += 1;
        return HttpResponse.json({
          data: null,
          errors: [
            {
              message: '입금액이 올바르지 않아요. 원 단위 정수로 입력해 주세요.',
              extensions: {
                code: 'DEPOSIT_AMOUNT_INVALID',
                classification: 'BAD_USER_INPUT',
                statusCode: 400,
              },
            },
          ],
        });
      }),
    );
    boot('/tasks/deposits?orderId=12');
    const s = await sheet(/주문 CQ-12/);
    await userEvent.type(within(s).getByLabelText('입금액(원) (필수)'), '1.5');
    await userEvent.click(within(s).getByRole('button', { name: '입금 확인' }));
    expect(
      await within(s).findByText('입금액을 원 단위 숫자로 입력해 주세요.'),
    ).toBeInTheDocument();
    expect(calls).toBe(0);

    await userEvent.clear(within(s).getByLabelText('입금액(원) (필수)'));
    await userEvent.type(within(s).getByLabelText('입금액(원) (필수)'), '0');
    await userEvent.click(within(s).getByRole('button', { name: '입금 확인' }));
    expect(
      await within(s).findByText('입금액이 올바르지 않아요. 원 단위 정수로 입력해 주세요.'),
    ).toBeInTheDocument();
    expect(calls).toBe(1);
  });

  it('주소의 금액 "0"과 주문 ID "0"을 그대로 보낸다', async () => {
    const { calls } = backend([
      order('0', { totalPrice: 0, payment: { ...order('0').payment!, amount: 0 } }),
    ]);
    boot('/tasks/deposits?view=pending&amount=0&orderId=0');
    expect(await sheet(/주문 CQ-0/)).toBeInTheDocument();
    expect(calls.order).toContain('0');
    await vi.waitFor(() =>
      expect(calls.list.at(-1)).toEqual({
        limit: 20,
        cursor: null,
        claimedOnly: false,
        amount: 0,
        depositorName: null,
      }),
    );
  });

  it('픽업이 지난 주문은 확인을 막고 미입금 취소로 닫는다', async () => {
    const { orders } = backend([
      order('12', {
        pickupAt: at(-60_000),
        payment: { ...order('12').payment!, expiresAt: at(-2 * H) },
      }),
    ]);
    let cancelInput: unknown;
    server.use(
      graphql.mutation('AdminTasksCancelUnpaid', ({ variables }) => {
        cancelInput = (variables as { input: unknown }).input;
        orders.set('12', {
          ...orders.get('12')!,
          status: 'CANCELED',
          payment: { ...orders.get('12')!.payment!, status: 'CANCELED' },
          cancellation: {
            actorType: 'ADMIN',
            reasonLabel: '입금 확인 안 됨',
            note: null,
            canceledAt: '2026-11-19T02:00:00.000Z',
          },
        });
        return HttpResponse.json({ data: { adminCancelOrder: { id: '12', status: 'CANCELED' } } });
      }),
    );
    boot('/tasks/deposits?orderId=12');
    const s = await sheet(/주문 CQ-12/);
    expect(within(s).getByRole('note')).toHaveTextContent(
      '픽업 시각이 지난 주문은 입금 확인할 수 없어요. 미입금 취소 뒤 반환 대상으로 연결해 주세요.',
    );
    expect(within(s).getByText('픽업 지남')).toBeInTheDocument();
    // '입금했어요'를 누른 주문이라 기한이 지나도 기한 지남은 달지 않는다
    expect(within(s).queryByText('기한 지남')).not.toBeInTheDocument();
    expect(within(s).queryByRole('button', { name: '입금 확인' })).not.toBeInTheDocument();

    await userEvent.click(within(s).getByRole('button', { name: '미입금 취소' }));
    const dialog = await screen.findByRole('dialog', { name: '미입금으로 취소할까요?' });
    await userEvent.click(within(dialog).getByRole('button', { name: '미입금 취소' }));
    await vi.waitFor(() =>
      expect(cancelInput).toEqual({ orderId: '12', reason: 'PAYMENT_NOT_RECEIVED', note: null }),
    );
    expect(await within(s).findByRole('status')).toHaveTextContent(
      `취소 · 관리자 · 입금 확인 안 됨 · ${formatKst('2026-11-19T02:00:00.000Z', true)}`,
    );
  });

  it('자동 취소된 주문은 취소 주체를 주문 화면과 같은 시스템으로 보인다', async () => {
    backend([
      order('14', {
        status: 'CANCELED',
        payment: { ...order('14').payment!, status: 'CANCELED' },
        cancellation: {
          actorType: 'SYSTEM',
          reasonLabel: '미입금',
          note: null,
          canceledAt: '2026-11-19T02:00:00.000Z',
        },
      }),
    ]);
    boot('/tasks/deposits?orderId=14');
    const s = await sheet(/주문 CQ-14/);
    expect(await within(s).findByRole('status')).toHaveTextContent(
      `취소 · 시스템 · 미입금 · ${formatKst('2026-11-19T02:00:00.000Z', true)}`,
    );
  });

  it('미입금 취소가 거절되면 다이얼로그를 열어 둔다', async () => {
    backend([order('12')]);
    server.use(
      gqlError('AdminTasksCancelUnpaid', {
        message: '메모가 너무 깁니다.',
        code: 'TEXT_TOO_LONG',
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
    );
    boot('/tasks/deposits?orderId=12');
    const s = await sheet(/주문 CQ-12/);
    await userEvent.click(within(s).getByRole('button', { name: '미입금 취소' }));
    const dialog = await screen.findByRole('dialog', { name: '미입금으로 취소할까요?' });
    await userEvent.click(within(dialog).getByRole('button', { name: '미입금 취소' }));
    expect(await screen.findByText('메모가 너무 깁니다.')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: '미입금으로 취소할까요?' })).toBeInTheDocument();
  });

  it('주인 모를 입금 기록은 메모가 없으면 보내지 않는다', async () => {
    backend([]);
    let input: unknown;
    let calls = 0;
    server.use(
      graphql.mutation('AdminTasksRecordUnidentifiedDeposit', ({ variables }) => {
        calls += 1;
        input = (variables as { input: unknown }).input;
        return HttpResponse.json({ data: { adminRecordUnidentifiedDeposit: { id: '9' } } });
      }),
    );
    boot('/tasks/deposits');
    await userEvent.click(await screen.findByRole('button', { name: '주인 모를 입금 기록' }));
    const dialog = await screen.findByRole('dialog', { name: '주인 모를 입금 기록' });
    await userEvent.type(within(dialog).getByLabelText('입금액(원) (필수)'), '5000');
    await userEvent.type(within(dialog).getByLabelText('입금자명 (필수)'), '홍길동');
    await userEvent.click(within(dialog).getByRole('button', { name: '종결 기록' }));
    expect(
      await within(dialog).findByText('주인 모를 입금은 메모를 남겨야 기록할 수 있어요.'),
    ).toBeInTheDocument();
    expect(calls).toBe(0);

    await userEvent.type(within(dialog).getByLabelText('메모 (필수)'), '주인 확인 불가');
    await userEvent.type(
      within(dialog).getByLabelText('입금 일시 (선택, 한국 시간)'),
      '2026-11-19T10:30',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: '종결 기록' }));
    await vi.waitFor(() =>
      expect(input).toEqual({
        amount: 5000,
        depositorName: '홍길동',
        depositedAt: '2026-11-19T01:30:00.000Z',
        note: '주인 확인 불가',
      }),
    );
    expect(
      await screen.findByText('주인 모를 입금을 종결 기록으로 남겼습니다.'),
    ).toBeInTheDocument();
  });

  it('종결 기록이 서버에서 거절되면 칸·폼 위에 이유를 보인다', async () => {
    backend([]);
    let round = 0;
    server.use(
      graphql.mutation('AdminTasksRecordUnidentifiedDeposit', () => {
        round += 1;
        const [code, message] =
          round === 1
            ? ['DEPOSIT_NOTE_REQUIRED', '서버: 메모 필요']
            : ['TEXT_TOO_LONG', '입금자명이 너무 깁니다.'];
        return HttpResponse.json({
          data: null,
          errors: [
            { message, extensions: { code, classification: 'BAD_USER_INPUT', statusCode: 400 } },
          ],
        });
      }),
    );
    boot('/tasks/deposits');
    await userEvent.click(await screen.findByRole('button', { name: '주인 모를 입금 기록' }));
    const dialog = await screen.findByRole('dialog', { name: '주인 모를 입금 기록' });
    await userEvent.type(within(dialog).getByLabelText('입금액(원) (필수)'), '5000');
    await userEvent.type(within(dialog).getByLabelText('입금자명 (필수)'), '홍길동');
    await userEvent.type(within(dialog).getByLabelText('메모 (필수)'), '메모');
    await userEvent.click(within(dialog).getByRole('button', { name: '종결 기록' }));
    expect(
      await within(dialog).findByText('주인 모를 입금은 메모를 남겨야 기록할 수 있어요.'),
    ).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: '종결 기록' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('입금자명이 너무 깁니다.');
  });

  it('확인 요청 목록은 픽업 3시간 미만·지남과 입금 기한 지남을 강조하고 보기·검색을 입력으로 보낸다', async () => {
    const soon = order('21', { pickupAt: at(2 * H) });
    const late = order('22', {
      pickupAt: at(-H),
      payment: { ...order('22').payment!, expiresAt: at(-2 * H) },
    });
    const later = order('23', {
      payment: { ...order('23').payment!, buyerClaimedAt: null, expiresAt: at(-60_000) },
    });
    const { calls } = backend([soon, late, later]);
    boot('/tasks/deposits');
    const soonRow = await screen.findByRole('row', { name: /CQ-21/ });
    expect(within(soonRow).getByText('3시간 미만')).toBeInTheDocument();
    // '입금했어요'를 누른 주문은 기한이 멈춰 픽업 지남만 단다
    const lateRow = screen.getByRole('row', { name: /CQ-22/ });
    expect(within(lateRow).getAllByText('지남')).toHaveLength(1);
    // 확인 요청 보기는 '입금했어요'를 누른 주문만
    expect(screen.queryByRole('button', { name: 'CQ-23' })).not.toBeInTheDocument();
    expect(await screen.findByRole('tab', { name: '확인 요청 2' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: '입금 대기 3' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: '입금 대기 3' }));
    expect(await screen.findByRole('button', { name: 'CQ-23' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('row', { name: /CQ-23/ })).getByText('지남'),
    ).toBeInTheDocument();
    expect(calls.list.at(-1)).toMatchObject({ claimedOnly: false });

    await userEvent.type(screen.getByLabelText('검색어'), '김입금{Enter}');
    await vi.waitFor(() => expect(calls.list.at(-1)).toMatchObject({ depositorName: '김입금' }));
    // 금액은 쉼표를 허용하고, Int 범위를 넘으면 필터를 조용히 버리지 않고 알린다
    await userEvent.type(screen.getByRole('textbox', { name: '금액' }), '30,000{Enter}');
    await vi.waitFor(() =>
      expect(calls.list.at(-1)).toMatchObject({ amount: 30000, depositorName: '김입금' }),
    );
    expect(window.location.search).toContain('amount=30000');
    const listCalls = calls.list.length;
    const amountBox = screen.getByRole('textbox', { name: '금액' });
    await userEvent.clear(amountBox);
    await userEvent.type(amountBox, '2147483648{Enter}');
    expect(await screen.findByText('원 단위 금액으로 입력해 주세요.')).toBeInTheDocument();
    expect(calls.list).toHaveLength(listCalls);
    expect(window.location.search).toContain('amount=30000');

    await userEvent.click(screen.getByRole('button', { name: 'CQ-23' }));
    const s = await sheet(/주문 CQ-23/);
    expect(s).toHaveTextContent('누르지 않음');
    expect(within(s).getByText('기한 지남')).toBeInTheDocument();
  });

  it('입금 기록 보기는 반환·종결을 보이고 종결 기록을 주문에 연결한다', async () => {
    backend([]);
    const records: DepositRecord[] = [
      {
        id: '31',
        kind: 'RETURN',
        orderId: '12',
        orderNumber: 'CQ-12',
        amount: 29000,
        depositorName: '김입금',
        depositedAt: '2026-11-19T01:00:00.000Z',
        note: '금액 틀린 입금',
        recordedByLabel: '운영(ops.admin)',
        refundId: '41',
        refundStatus: 'AWAITING_ACCOUNT',
        createdAt: '2026-11-19T01:05:00.000Z',
      },
      {
        id: '32',
        kind: 'UNIDENTIFIED',
        orderId: null,
        orderNumber: null,
        amount: 5000,
        depositorName: '홍길동',
        depositedAt: null,
        note: '주인 확인 불가',
        recordedByLabel: null,
        refundId: null,
        refundStatus: null,
        createdAt: '2026-11-19T01:10:00.000Z',
      },
    ];
    const inputs: unknown[] = [];
    let linkInput: unknown;
    server.use(
      graphql.query('AdminTasksDepositRecords', ({ variables }) => {
        inputs.push((variables as { input: unknown }).input);
        return HttpResponse.json({
          data: {
            adminDepositRecords: {
              items: records,
              totalCount: 2,
              hasMore: false,
              nextCursor: null,
            },
          },
        });
      }),
      gqlOk('AdminTasksOrderOptions', {
        adminOrders: {
          items: [{ id: '77', orderNumber: 'CQ-77', buyerName: '홍길동', totalPrice: 5000 }],
        },
      }),
      graphql.mutation('AdminTasksLinkUnidentifiedDeposit', ({ variables }) => {
        linkInput = (variables as { input: unknown }).input;
        return HttpResponse.json({
          data: { adminLinkUnidentifiedDeposit: { id: '32' } },
        });
      }),
    );
    boot('/tasks/deposits?view=records');
    // 셀 내용은 다시 그릴 때 새로 마운트되므로 행(tr)을 잡는다
    await screen.findByRole('tab', { name: '확인 요청 0' });
    const returnRow = await screen.findByRole('row', { name: /금액 틀린 입금/ });
    expect(within(returnRow).getByRole('link', { name: 'CQ-12' })).toHaveAttribute(
      'href',
      '/orders/12',
    );
    expect(within(returnRow).getByRole('link', { name: '계좌 입력 대기' })).toHaveAttribute(
      'href',
      '/tasks/refunds?refundId=41',
    );
    expect(
      within(returnRow).queryByRole('button', { name: '주문에 연결' }),
    ).not.toBeInTheDocument();

    const closedRow = screen.getByRole('row', { name: /주인 확인 불가/ });
    expect(within(closedRow).getByText('종결')).toBeInTheDocument();
    await userEvent.click(within(closedRow).getByRole('button', { name: '주문에 연결' }));
    const dialog = await screen.findByRole('dialog', { name: '주문에 연결' });
    const submit = within(dialog).getByRole('button', { name: '반환 대상으로 연결' });
    expect(submit).toBeDisabled();
    await userEvent.click(within(dialog).getByRole('combobox', { name: /^주문/ }));
    await userEvent.click(await screen.findByRole('option', { name: /CQ-77/ }));
    await userEvent.click(submit);
    await vi.waitFor(() => expect(linkInput).toEqual({ depositRecordId: '32', orderId: '77' }));
    expect(
      await screen.findByText(
        '종결 기록을 반환 대상으로 바꿨습니다. 구매자에게 환불 계좌 입력을 요청했어요.',
      ),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('combobox', { name: '기록 종류' }));
    await userEvent.click(await screen.findByRole('option', { name: '종결' }));
    await vi.waitFor(() =>
      expect(inputs.at(-1)).toEqual({ limit: 20, cursor: null, kind: 'UNIDENTIFIED' }),
    );
  });

  it('이미 연결된 종결 기록(409)이면 토스트를 보이고 다이얼로그를 닫는다', async () => {
    backend([]);
    server.use(
      gqlOk('AdminTasksDepositRecords', {
        adminDepositRecords: {
          items: [
            {
              id: '32',
              kind: 'UNIDENTIFIED',
              orderId: null,
              orderNumber: null,
              amount: 5000,
              depositorName: '홍길동',
              depositedAt: null,
              note: '주인 확인 불가',
              recordedByLabel: null,
              refundId: null,
              refundStatus: null,
              createdAt: '2026-11-19T01:10:00.000Z',
            },
          ],
          totalCount: 1,
          hasMore: false,
          nextCursor: null,
        },
      }),
      gqlOk('AdminTasksOrderOptions', {
        adminOrders: {
          items: [{ id: '77', orderNumber: 'CQ-77', buyerName: '홍길동', totalPrice: 5000 }],
        },
      }),
      gqlError('AdminTasksLinkUnidentifiedDeposit', {
        message: '이미 반환 대상으로 연결된 입금 기록입니다.',
        code: 'DEPOSIT_RECORD_ALREADY_LINKED',
        classification: 'CONFLICT',
        statusCode: 409,
      }),
    );
    boot('/tasks/deposits?view=records');
    await screen.findByRole('tab', { name: '확인 요청 0' });
    const row = await screen.findByRole('row', { name: /주인 확인 불가/ });
    await userEvent.click(within(row).getByRole('button', { name: '주문에 연결' }));
    const dialog = await screen.findByRole('dialog', { name: '주문에 연결' });
    await userEvent.click(within(dialog).getByRole('combobox', { name: /^주문/ }));
    await userEvent.click(await screen.findByRole('option', { name: /CQ-77/ }));
    await userEvent.click(within(dialog).getByRole('button', { name: '반환 대상으로 연결' }));
    expect(
      await screen.findByText('이미 반환 대상으로 연결된 입금 기록입니다.'),
    ).toBeInTheDocument();
    await vi.waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '주문에 연결' })).not.toBeInTheDocument(),
    );
  });

  it('없는 주문 ID로 열면 시트에 오류를 보인다', async () => {
    backend([]);
    boot('/tasks/deposits?orderId=999');
    const s = await sheet(/^주문$/);
    expect(await within(s).findByText('주문을 찾을 수 없습니다.')).toBeInTheDocument();
  });

  it('입금 확인 대상이 아닌 옛 주문은 처리됨을 보이고, 입금 기록 보기에서 열면 다음 건을 두지 않는다', async () => {
    backend([order('50', { status: 'SUBMITTED', payment: null })]);
    server.use(
      gqlOk('AdminTasksDepositRecords', {
        adminDepositRecords: { items: [], totalCount: 0, hasMore: false, nextCursor: null },
      }),
      gqlError('AdminTasksCreateDepositReturn', {
        message: '주문을 찾을 수 없습니다.',
        code: 'ORDER_NOT_FOUND',
        classification: 'NOT_FOUND',
        statusCode: 404,
      }),
    );
    boot('/tasks/deposits?view=records&orderId=50');
    const s = await sheet(/주문 CQ-50/);
    expect(await within(s).findByRole('status')).toHaveTextContent(
      '입금 확인 대기 주문이 아닙니다',
    );
    expect(within(s).queryByText('남은 건이 없습니다.')).not.toBeInTheDocument();
    expect(within(s).queryByRole('button', { name: '미입금 취소' })).not.toBeInTheDocument();

    // 상태와 관계없이 반환은 연결할 수 있다. 입력 오류가 아닌 거절은 토스트로 알리고 창을 둔다
    await userEvent.click(within(s).getByRole('button', { name: '반환 대상으로 연결' }));
    const dialog = await screen.findByRole('dialog', { name: '반환 대상으로 연결' });
    expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText('입금액(원) (필수)')).toHaveValue('');
    await userEvent.type(within(dialog).getByLabelText('입금액(원) (필수)'), '1000');
    await userEvent.type(within(dialog).getByLabelText('입금자명 (필수)'), '김입금');
    await userEvent.click(within(dialog).getByRole('button', { name: '반환 대상으로 연결' }));
    expect(await screen.findByText('주문을 찾을 수 없습니다.')).toBeInTheDocument();
    // 첫 번째가 폼의 [닫기], 마지막은 대화상자 모서리의 X
    await userEvent.click(within(dialog).getAllByRole('button', { name: '닫기' })[0]!);
    await vi.waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '반환 대상으로 연결' })).not.toBeInTheDocument(),
    );
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(query().get('orderId')).toBeNull());
    expect(query().get('view')).toBe('records');
  });

  it('입금액 외 입력 오류는 확인 폼 위에 보인다', async () => {
    backend([order('12')]);
    server.use(
      gqlError('AdminTasksConfirmPayment', {
        message: '메모가 너무 깁니다.',
        code: 'TEXT_TOO_LONG',
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
    );
    boot('/tasks/deposits?orderId=12');
    const s = await sheet(/주문 CQ-12/);
    await userEvent.type(within(s).getByLabelText('입금액(원) (필수)'), '30000');
    await userEvent.click(within(s).getByRole('button', { name: '입금 확인' }));
    expect(await within(s).findByRole('alert')).toHaveTextContent('메모가 너무 깁니다.');
    expect(screen.queryByRole('dialog', { name: '반환 대상으로 연결' })).not.toBeInTheDocument();
  });

  it('행을 눌러 시트를 열고, 다음 페이지 커서와 초기화를 입력으로 보낸다', async () => {
    const inputs: Record<string, unknown>[] = [];
    backend([]);
    server.use(
      graphql.query('AdminTasksPendingPayments', ({ variables }) => {
        const input = (variables as { input: Record<string, unknown> }).input;
        inputs.push(input);
        return HttpResponse.json({
          data: {
            adminPendingPayments: {
              items: [row(order(input.cursor ? '14' : '12'))],
              totalCount: 2,
              hasMore: !input.cursor,
              nextCursor: input.cursor ? null : 'c2',
            },
          },
        });
      }),
      gqlOk('AdminTasksOrder', { adminOrder: order('12') }),
    );
    boot('/tasks/deposits?view=pending&depositorName=김');
    await userEvent.click(await screen.findByRole('row', { name: /CQ-12/ }));
    expect(await sheet(/주문 CQ-12/)).toBeInTheDocument();
    await vi.waitFor(() => expect(query().get('orderId')).toBe('12'));
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(query().get('orderId')).toBeNull());

    await userEvent.click(screen.getByRole('button', { name: /다음/ }));
    await vi.waitFor(() =>
      expect(inputs.at(-1)).toMatchObject({ cursor: 'c2', depositorName: '김' }),
    );
    await userEvent.click(screen.getByRole('button', { name: '초기화' }));
    await vi.waitFor(() =>
      expect(inputs.at(-1)).toMatchObject({
        cursor: null,
        depositorName: null,
        claimedOnly: false,
      }),
    );
  });

  it('목록을 읽지 못하면 이유를 보인다', async () => {
    backend([]);
    server.use(
      gqlError('AdminTasksPendingPayments', {
        message: '목록 오류',
        code: 'X',
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
      gqlError('AdminTasksDepositRecords', {
        message: '기록 오류',
        code: 'X',
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
    );
    boot('/tasks/deposits');
    expect(await screen.findByRole('alert')).toHaveTextContent('목록 오류');
    await userEvent.click(screen.getByRole('tab', { name: /입금 기록/ }));
    expect(await screen.findByText('기록 오류')).toBeInTheDocument();
  });

  it('입금 기록 다음 페이지와 주문 연결 창 닫기', async () => {
    backend([]);
    const inputs: Record<string, unknown>[] = [];
    const record: DepositRecord = {
      id: '32',
      kind: 'UNIDENTIFIED',
      orderId: null,
      orderNumber: null,
      amount: 5000,
      depositorName: '홍길동',
      depositedAt: null,
      note: null,
      recordedByLabel: null,
      refundId: null,
      refundStatus: null,
      createdAt: '2026-11-19T01:10:00.000Z',
    };
    server.use(
      graphql.query('AdminTasksDepositRecords', ({ variables }) => {
        const input = (variables as { input: Record<string, unknown> }).input;
        inputs.push(input);
        return HttpResponse.json({
          data: {
            adminDepositRecords: {
              items: [record],
              totalCount: 2,
              hasMore: !input.cursor,
              nextCursor: input.cursor ? null : 'r2',
            },
          },
        });
      }),
    );
    boot('/tasks/deposits?view=records&amount=5000');
    await screen.findByRole('tab', { name: '확인 요청 0' });
    const r = await screen.findByRole('row', { name: /홍길동/ });
    // 입금 기록 보기에 없는 금액 필터는 초기화 대상으로 세지 않는다
    expect(screen.queryByRole('button', { name: '초기화' })).not.toBeInTheDocument();
    await userEvent.click(within(r).getByRole('button', { name: '주문에 연결' }));
    await screen.findByRole('dialog', { name: '주문에 연결' });
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '주문에 연결' })).not.toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole('button', { name: /다음/ }));
    await vi.waitFor(() => expect(inputs.at(-1)).toMatchObject({ cursor: 'r2' }));
  });

  it('세션이 없으면 로그인 뒤 같은 딥링크로 돌아와 시트를 연다', async () => {
    backend([order('12')]);
    server.use(
      restError('/admin/refresh', 401, '없음', 'MISSING_REFRESH_TOKEN'),
      restOk('/admin/login', session),
    );
    boot('/tasks/deposits?orderId=12');
    expect(await screen.findByText('관리자 로그인')).toBeInTheDocument();
    expect(query().get('redirect')).toBe('/tasks/deposits?orderId=12');
    await userEvent.type(screen.getByLabelText('아이디'), 'ops.admin');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));
    expect(await sheet(/주문 CQ-12/)).toBeInTheDocument();
    expect(window.location.pathname).toBe('/tasks/deposits');
    expect(query().get('orderId')).toBe('12');
  });
});
