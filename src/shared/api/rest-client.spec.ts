import { HttpResponse, http } from 'msw';

import { server } from '@/test/msw/server';
import { restError, restOk } from '@/test/msw/graphql';

import { AUTH_URL, ApiError, authRequest, registerSessionHooks } from './index';

describe('authRequest', () => {
  afterEach(() => {
    registerSessionHooks({ getAccessToken: () => null, refresh: () => Promise.resolve(false) });
  });

  it('JSON 본문을 보내고 응답 본문을 돌려준다(envelope 없음)', async () => {
    let received: unknown;
    let credentials: RequestCredentials | undefined;
    server.use(
      http.post(`${AUTH_URL}/admin/login`, async ({ request }) => {
        received = await request.json();
        credentials = request.credentials;
        return HttpResponse.json({ accessToken: 'a', tokenType: 'Bearer' });
      }),
    );
    const res = await authRequest<{ accessToken: string }>('/admin/login', {
      body: { username: 'u', password: 'p' },
    });
    expect(res.accessToken).toBe('a');
    expect(received).toEqual({ username: 'u', password: 'p' });
    expect(credentials).toBe('include');
  });

  it('204는 undefined', async () => {
    server.use(restOk('/admin/logout', null, 204));
    await expect(authRequest('/admin/logout')).resolves.toBeUndefined();
  });

  it('에러 envelope는 errorCode·상태 분류를 가진 ApiError', async () => {
    server.use(restError('/admin/login', 401, '아이디 또는 비밀번호', 'INVALID_CREDENTIALS'));
    const err = await authRequest('/admin/login', { body: {} }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({
      code: 'INVALID_CREDENTIALS',
      classification: 'UNAUTHENTICATED',
      status: 401,
    });
  });

  it('본문 없는 에러도 상태로 분류한다', async () => {
    server.use(
      http.post(`${AUTH_URL}/admin/refresh`, () => new HttpResponse(null, { status: 403 })),
    );
    await expect(authRequest('/admin/refresh')).rejects.toMatchObject({
      classification: 'FORBIDDEN',
      code: null,
    });
  });

  it('auth: true면 Bearer 토큰을 붙인다', async () => {
    registerSessionHooks({ getAccessToken: () => 'tok', refresh: () => Promise.resolve(false) });
    let auth: string | null = null;
    server.use(
      http.post(`${AUTH_URL}/admin/change-password`, ({ request }) => {
        auth = request.headers.get('authorization');
        return HttpResponse.json({ ok: true });
      }),
    );
    await authRequest('/admin/change-password', { auth: true, body: {} });
    expect(auth).toBe('Bearer tok');
  });

  it('네트워크 실패는 NETWORK', async () => {
    server.use(http.post(`${AUTH_URL}/admin/login`, () => HttpResponse.error()));
    await expect(authRequest('/admin/login', { body: {} })).rejects.toMatchObject({
      classification: 'NETWORK',
    });
  });
});
