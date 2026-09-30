import { QueryClient } from '@tanstack/react-query';
import { HttpResponse, graphql } from 'msw';

import { server } from '@/test/msw/server';

import { broadcastsQueryOptions, sendNotification } from './queries';

describe('notification api', () => {
  it('보내면 발송 이력 목록을 무효화해 새 이력이 바로 보이게 한다', async () => {
    server.use(
      graphql.mutation('AdminSendNotification', () =>
        HttpResponse.json({
          data: {
            adminSendNotification: { sentCount: 3, skippedAccountIds: [], broadcastId: '78' },
          },
        }),
      ),
    );
    const qc = new QueryClient();
    const filtered = broadcastsQueryOptions({ limit: 20, type: 'SYSTEM' }).queryKey;
    qc.setQueryData(filtered, { items: [], totalCount: 0, hasMore: false, nextCursor: null });

    const r = await sendNotification(qc, {
      type: 'SYSTEM',
      title: 't',
      body: 'b',
      idempotencyKey: 'admin-key-1',
      targetKind: 'ALL_USERS',
    });
    expect(r.broadcastId).toBe('78');
    expect(qc.getQueryState(filtered)?.isInvalidated).toBe(true);
  });
});
