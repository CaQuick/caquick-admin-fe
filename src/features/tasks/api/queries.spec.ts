import { QueryClient, QueryObserver } from '@tanstack/react-query';

import { dashboardSummaryQueryOptions } from '@/features/dashboard/api/queries';
import { ordersListQueryOptions } from '@/features/orders/api/queries';
import { settlementsListQueryOptions } from '@/features/settlements/api/queries';
import { gqlCounted, gqlError } from '@/test/msw/graphql';
import { server } from '@/test/msw/server';

import { taskCountsQueryOptions, taskMutations } from './queries';

const page = { items: [], totalCount: 0, hasMore: false, nextCursor: null };
const watched = {
  AdminOrders: { adminOrders: page },
  AdminSettlements: { adminSettlements: page },
  AdminDashboardSummary: { adminDashboardSummary: {} },
  AdminTaskCounts: { adminTaskCounts: {} },
};

/** 주문·정산·대시보드·처리 대기 건수를 화면처럼 구독한다. invalidate는 구독 중인 쿼리만 다시 요청한다 */
async function watchOthers(answers: Record<string, Record<string, unknown>>) {
  const { counts, handler } = gqlCounted({ ...watched, ...answers });
  server.use(handler);
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const stops = [
    new QueryObserver(qc, ordersListQueryOptions({})),
    new QueryObserver(qc, settlementsListQueryOptions({})),
    new QueryObserver(
      qc,
      dashboardSummaryQueryOptions('2026-11-18T15:00:00.000Z', '2026-11-19T14:59:59.999Z'),
    ),
    new QueryObserver(qc, taskCountsQueryOptions()),
  ].map((o) => o.subscribe(() => undefined));
  await vi.waitFor(() =>
    expect(Object.keys(watched).map((op) => counts[op])).toEqual([1, 1, 1, 1]),
  );
  return { qc, counts, stop: () => stops.forEach((s) => s()) };
}

describe('처리 뒤 교차 무효화', () => {
  it.each([
    [
      '입금 확인',
      { AdminTasksConfirmPayment: { adminConfirmPayment: { id: '1' } } },
      (qc: QueryClient) => taskMutations.confirmPayment(qc, { orderId: '1', depositedAmount: 0 }),
    ],
    [
      '미입금 취소',
      { AdminTasksCancelUnpaid: { adminCancelOrder: { id: '1' } } },
      (qc: QueryClient) => taskMutations.cancelUnpaid(qc, '1', ''),
    ],
    [
      '입금 반환',
      { AdminTasksCreateDepositReturn: { adminCreateDepositReturn: { id: '1', refundId: '2' } } },
      (qc: QueryClient) =>
        taskMutations.createDepositReturn(qc, { orderId: '1', amount: 1, depositorName: '김' }),
    ],
    [
      '주인 모를 입금 기록',
      { AdminTasksRecordUnidentifiedDeposit: { adminRecordUnidentifiedDeposit: { id: '1' } } },
      (qc: QueryClient) =>
        taskMutations.recordUnidentifiedDeposit(qc, {
          amount: 1,
          depositorName: '김',
          note: '메모',
        }),
    ],
    [
      '종결 기록 연결',
      { AdminTasksLinkUnidentifiedDeposit: { adminLinkUnidentifiedDeposit: { id: '1' } } },
      (qc: QueryClient) => taskMutations.linkUnidentifiedDeposit(qc, '3', '1'),
    ],
    [
      '환불 송금 완료',
      { AdminTasksCompleteRefund: { adminCompleteRefund: { id: '1' } } },
      (qc: QueryClient) => taskMutations.completeRefund(qc, '1', ''),
    ],
  ] as const)(
    '%s 뒤 주문·정산·대시보드·처리 대기 건수를 다시 요청한다',
    async (_, answers, mutate) => {
      const { qc, counts, stop } = await watchOthers(answers);
      await mutate(qc);
      expect(counts).toMatchObject({
        AdminOrders: 2,
        AdminSettlements: 2,
        AdminDashboardSummary: 2,
        AdminTaskCounts: 2,
      });
      stop();
    },
  );

  it('거절돼도(409) 다른 화면을 다시 요청한다', async () => {
    const { qc, counts, stop } = await watchOthers({});
    server.use(
      gqlError('AdminTasksConfirmPayment', {
        message: '이미 처리됐습니다.',
        code: 'PAYMENT_NOT_PENDING',
        classification: 'CONFLICT',
        statusCode: 409,
      }),
    );
    await expect(
      taskMutations.confirmPayment(qc, { orderId: '1', depositedAmount: 0 }),
    ).rejects.toThrow('이미 처리됐습니다.');
    expect(counts).toMatchObject({ AdminOrders: 2, AdminSettlements: 2, AdminDashboardSummary: 2 });
    stop();
  });
});
