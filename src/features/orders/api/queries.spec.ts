import { QueryClient, QueryObserver } from '@tanstack/react-query';

import { taskCountsQueryOptions } from '@/features/tasks/api/queries';
import { gqlCounted, gqlError } from '@/test/msw/graphql';
import { server } from '@/test/msw/server';

import { cancelOrder, completeOrderPickup } from './queries';

/** 사이드바처럼 처리 대기 건수를 구독한다. invalidate는 구독 중인 쿼리만 다시 요청한다 */
async function watchTaskCounts(answers: Record<string, Record<string, unknown>>) {
  const { counts, handler } = gqlCounted({ AdminTaskCounts: { adminTaskCounts: {} }, ...answers });
  server.use(handler);
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const stop = new QueryObserver(qc, taskCountsQueryOptions()).subscribe(() => undefined);
  await vi.waitFor(() => expect(counts.AdminTaskCounts).toBe(1));
  return { qc, counts, stop };
}

describe('주문 처리 뒤 처리 대기 건수', () => {
  it('강제 취소 뒤 다시 요청한다', async () => {
    const { qc, counts, stop } = await watchTaskCounts({
      AdminCancelOrder: { adminCancelOrder: { id: '1' } },
    });
    await cancelOrder(qc, { orderId: '1', reason: 'PAYMENT_NOT_RECEIVED' });
    expect(counts.AdminTaskCounts).toBe(2);
    stop();
  });

  it('관리자 픽업 완료 뒤 다시 요청한다', async () => {
    const { qc, counts, stop } = await watchTaskCounts({
      AdminCompleteOrderPickup: { adminCompleteOrderPickup: { id: '1' } },
    });
    await completeOrderPickup(qc, '1', '');
    expect(counts.AdminTaskCounts).toBe(2);
    stop();
  });

  it('취소가 거절돼도(409) 다시 요청한다', async () => {
    const { qc, counts, stop } = await watchTaskCounts({});
    server.use(
      gqlError('AdminCancelOrder', {
        message: '취소할 수 없는 상태입니다.',
        code: 'ORDER_NOT_CANCELLABLE',
        classification: 'CONFLICT',
        statusCode: 409,
      }),
    );
    await expect(cancelOrder(qc, { orderId: '1', reason: 'PAYMENT_NOT_RECEIVED' })).rejects.toThrow(
      '취소할 수 없는 상태입니다.',
    );
    expect(counts.AdminTaskCounts).toBe(2);
    stop();
  });
});
