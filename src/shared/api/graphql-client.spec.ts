import { HttpResponse, graphql, http } from 'msw';

import { server } from '@/test/msw/server';
import { gqlError, gqlOk, graphqlError } from '@/test/msw/graphql';

import { ApiError, GRAPHQL_URL, gqlRequest, registerSessionHooks } from './index';

import { AdminMeDocument as PingDocument } from '@/features/account';

describe('gqlRequest', () => {
  afterEach(() => {
    registerSessionHooks({ getAccessToken: () => null, refresh: () => Promise.resolve(false) });
  });

  it('Bearer 토큰과 쿠키를 붙여 보내고 data를 돌려준다', async () => {
    registerSessionHooks({ getAccessToken: () => 'tok-1', refresh: () => Promise.resolve(false) });
    let auth: string | null = null;
    let credentials: RequestCredentials | undefined;
    server.use(
      graphql.query('AdminMe', ({ request }) => {
        auth = request.headers.get('authorization');
        credentials = request.credentials;
        return HttpResponse.json({ data: { adminMe: { accountId: '1' } } });
      }),
    );
    const data = await gqlRequest(PingDocument);
    expect(data.adminMe.accountId).toBe('1');
    expect(auth).toBe('Bearer tok-1');
    expect(credentials).toBe('include');
  });

  it('errors[]는 ApiError(code·classification)로 바뀐다', async () => {
    server.use(
      gqlError('AdminMe', {
        message: '권한 없음',
        code: 'ACCOUNT_TYPE_NOT_ALLOWED',
        classification: 'FORBIDDEN',
        statusCode: 403,
      }),
    );
    const err = await gqlRequest(PingDocument).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({
      code: 'ACCOUNT_TYPE_NOT_ALLOWED',
      classification: 'FORBIDDEN',
      status: 403,
    });
  });

  it('UNAUTHENTICATED면 refresh 1회 뒤 재시도한다', async () => {
    let refreshed = 0;
    registerSessionHooks({
      getAccessToken: () => (refreshed ? 'new' : 'old'),
      refresh: () => {
        refreshed += 1;
        return Promise.resolve(true);
      },
    });
    const seen: string[] = [];
    server.use(
      graphql.query('AdminMe', ({ request }) => {
        seen.push(request.headers.get('authorization') ?? '');
        if (seen.length === 1) {
          return HttpResponse.json({
            data: null,
            errors: [
              graphqlError({
                message: '만료',
                code: 'AUTHENTICATION_REQUIRED',
                classification: 'UNAUTHENTICATED',
                statusCode: 401,
              }),
            ],
          });
        }
        return HttpResponse.json({ data: { adminMe: { accountId: '7' } } });
      }),
    );
    const data = await gqlRequest(PingDocument);
    expect(data.adminMe.accountId).toBe('7');
    expect(refreshed).toBe(1);
    expect(seen).toEqual(['Bearer old', 'Bearer new']);
  });

  it('refresh가 실패하면 UNAUTHENTICATED ApiError를 던지고 재시도하지 않는다', async () => {
    let calls = 0;
    server.use(
      graphql.query('AdminMe', () => {
        calls += 1;
        return HttpResponse.json({
          data: null,
          errors: [
            graphqlError({ message: '만료', classification: 'UNAUTHENTICATED', statusCode: 401 }),
          ],
        });
      }),
    );
    await expect(gqlRequest(PingDocument)).rejects.toMatchObject({
      classification: 'UNAUTHENTICATED',
    });
    expect(calls).toBe(1);
  });

  it('HTTP 401에 본문이 없어도 UNAUTHENTICATED로 분류한다', async () => {
    server.use(http.post(GRAPHQL_URL, () => new HttpResponse(null, { status: 401 })));
    await expect(gqlRequest(PingDocument)).rejects.toMatchObject({
      classification: 'UNAUTHENTICATED',
      status: 401,
    });
  });

  it('data 없는 5xx는 INTERNAL_SERVER_ERROR', async () => {
    server.use(http.post(GRAPHQL_URL, () => HttpResponse.json({}, { status: 502 })));
    await expect(gqlRequest(PingDocument)).rejects.toMatchObject({
      classification: 'INTERNAL_SERVER_ERROR',
      status: 502,
    });
  });

  it('네트워크 실패는 NETWORK', async () => {
    server.use(http.post(GRAPHQL_URL, () => HttpResponse.error()));
    await expect(gqlRequest(PingDocument)).rejects.toMatchObject({ classification: 'NETWORK' });
  });

  it('gqlOk 헬퍼는 operation 이름으로 응답한다', async () => {
    server.use(gqlOk('AdminMe', { adminMe: { accountId: '3' } }));
    await expect(gqlRequest(PingDocument)).resolves.toEqual({ adminMe: { accountId: '3' } });
  });
});
