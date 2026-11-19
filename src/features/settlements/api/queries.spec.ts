import { QueryClient, QueryObserver } from '@tanstack/react-query';

import { settlementsQueryOptions, taskCountsQueryOptions } from '@/features/tasks/api/queries';
import { gqlCounted, gqlError } from '@/test/msw/graphql';
import { server } from '@/test/msw/server';

import { markSettlementPaid, upsertStoreSettlementAccount } from './queries';

const page = { items: [], totalCount: 0, hasMore: false, nextCursor: null };

/** 처리 대기 건수·정산 송금 목록을 화면처럼 구독한다. invalidate는 구독 중인 쿼리만 다시 요청한다 */
async function watchTasks(answers: Record<string, Record<string, unknown>>) {
  const { counts, handler } = gqlCounted({
    AdminTaskCounts: { adminTaskCounts: {} },
    AdminTasksSettlements: { adminSettlements: page },
    ...answers,
  });
  server.use(handler);
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const stops = [
    new QueryObserver(qc, taskCountsQueryOptions()),
    new QueryObserver(qc, settlementsQueryOptions({})),
  ].map((o) => o.subscribe(() => undefined));
  await vi.waitFor(() =>
    expect([counts.AdminTaskCounts, counts.AdminTasksSettlements]).toEqual([1, 1]),
  );
  return { qc, counts, stop: () => stops.forEach((s) => s()) };
}

describe('정산 처리 뒤 처리 대기', () => {
  it('송금 완료 뒤 건수·정산 송금 목록을 다시 요청한다', async () => {
    const { qc, counts, stop } = await watchTasks({
      AdminMarkSettlementPaid: { adminMarkSettlementPaid: { id: '1' } },
    });
    await markSettlementPaid(qc, '1', null);
    expect(counts).toMatchObject({ AdminTaskCounts: 2, AdminTasksSettlements: 2 });
    stop();
  });

  it('송금 완료가 거절돼도(409) 다시 요청한다', async () => {
    const { qc, counts, stop } = await watchTasks({});
    server.use(
      gqlError('AdminMarkSettlementPaid', {
        message: '이미 송금 완료로 처리된 정산이에요.',
        code: 'SETTLEMENT_ALREADY_PAID',
        classification: 'CONFLICT',
        statusCode: 409,
      }),
    );
    await expect(markSettlementPaid(qc, '1', null)).rejects.toThrow(
      '이미 송금 완료로 처리된 정산이에요.',
    );
    expect(counts).toMatchObject({ AdminTaskCounts: 2, AdminTasksSettlements: 2 });
    stop();
  });

  it('매장 정산 계좌를 등록하면 정산 송금 목록(계좌 등록 여부)을 다시 요청한다', async () => {
    const { qc, counts, stop } = await watchTasks({
      AdminUpsertStoreSettlementAccount: { adminUpsertStoreSettlementAccount: { storeId: '5' } },
    });
    await upsertStoreSettlementAccount(qc, {
      storeId: '5',
      bankCode: '004',
      accountNumber: '12345678',
      accountHolder: '루미',
      reason: '등록',
    });
    expect(counts.AdminTasksSettlements).toBe(2);
    stop();
  });
});
