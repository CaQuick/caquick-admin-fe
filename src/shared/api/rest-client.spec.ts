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

  describe('auth 요청의 401 재시도', () => {
    /** 첫 요청은 주어진 에러, 이후는 성공. 받은 Authorization 헤더를 순서대로 모은다. */
    function changePasswordOnce(status: number, errorCode: string | null) {
      const auths: (string | null)[] = [];
      server.use(
        http.post(`${AUTH_URL}/admin/change-password`, ({ request }) => {
          auths.push(request.headers.get('authorization'));
          return auths.length === 1
            ? HttpResponse.json({ message: 'x', code: status, data: null, errorCode }, { status })
            : HttpResponse.json({ ok: true });
        }),
      );
      return auths;
    }

    function hooks(refreshed: boolean) {
      let token = 'old';
      const refresh = vi.fn(() => {
        if (refreshed) token = 'new';
        return Promise.resolve(refreshed);
      });
      registerSessionHooks({ getAccessToken: () => token, refresh });
      return refresh;
    }

    it.each([
      [true, 401, 'INVALID_ACCESS_TOKEN', 1],
      [true, 401, 'AUTHENTICATION_REQUIRED', 1],
      [true, 401, 'CURRENT_PASSWORD_INVALID', 0],
      [true, 401, 'SESSION_ACCOUNT_MISSING', 0],
      [true, 401, null, 0],
      [true, 403, 'INVALID_ACCESS_TOKEN', 0],
      [false, 401, 'INVALID_ACCESS_TOKEN', 0],
    ] as const)('auth=%s·%d·%s면 refresh %d회', async (auth, status, errorCode, calls) => {
      const refresh = hooks(true);
      changePasswordOnce(status, errorCode);
      await authRequest('/admin/change-password', { auth, body: {} }).catch(() => undefined);
      expect(refresh).toHaveBeenCalledTimes(calls);
    });

    it('토큰 만료 401은 갱신한 토큰으로 한 번 더 보내 성공한다', async () => {
      hooks(true);
      const auths = changePasswordOnce(401, 'INVALID_ACCESS_TOKEN');
      await expect(
        authRequest('/admin/change-password', { auth: true, body: {} }),
      ).resolves.toEqual({ ok: true });
      expect(auths).toEqual(['Bearer old', 'Bearer new']);
    });

    it('현재 비밀번호 오류 401은 재시도 없이 그대로 던진다', async () => {
      hooks(true);
      const auths = changePasswordOnce(401, 'CURRENT_PASSWORD_INVALID');
      await expect(
        authRequest('/admin/change-password', { auth: true, body: {} }),
      ).rejects.toMatchObject({ code: 'CURRENT_PASSWORD_INVALID', status: 401 });
      expect(auths).toHaveLength(1);
    });

    it('refresh가 실패하면 재시도 없이 원래 401을 던진다', async () => {
      hooks(false);
      const auths = changePasswordOnce(401, 'INVALID_ACCESS_TOKEN');
      await expect(
        authRequest('/admin/change-password', { auth: true, body: {} }),
      ).rejects.toMatchObject({ code: 'INVALID_ACCESS_TOKEN', classification: 'UNAUTHENTICATED' });
      expect(auths).toHaveLength(1);
    });
  });

  it('네트워크 실패는 NETWORK', async () => {
    server.use(http.post(`${AUTH_URL}/admin/login`, () => HttpResponse.error()));
    await expect(authRequest('/admin/login', { body: {} })).rejects.toMatchObject({
      classification: 'NETWORK',
    });
  });
});
