import { QueryClient } from '@tanstack/react-query';

import { gqlOk } from '@/test/msw/graphql';
import { server } from '@/test/msw/server';

import { accountKeys, adminMeQueryOptions } from './queries';

describe('adminMeQueryOptions', () => {
  it('adminMe를 조회해 계정 객체를 돌려준다', async () => {
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
    server.use(gqlOk('AdminMe', { adminMe: me }));
    const client = new QueryClient();
    await expect(client.fetchQuery(adminMeQueryOptions())).resolves.toEqual(me);
    expect(adminMeQueryOptions().queryKey).toEqual(accountKeys.me());
  });
});
