import { HttpResponse, http } from 'msw';

import { AUTH_URL, registerSessionHooks } from '@/shared/api';
import { restError, restOk } from '@/test/msw/graphql';
import { server } from '@/test/msw/server';

import { changePassword, ensureSession, installSessionHooks, login, logout } from './session';
import { useAuthStore } from './store';

const session = (mustChangePassword = false) => ({
  accessToken: 'at',
  tokenType: 'Bearer' as const,
  accountStatus: 'ACTIVE' as const,
  mustChangePassword,
});

describe('auth session', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false });
    installSessionHooks();
  });
  afterEach(() => {
    registerSessionHooks({ getAccessToken: () => null, refresh: () => Promise.resolve(false) });
  });

  it('ensureSession은 모르는 상태면 refresh로 복원한다', async () => {
    server.use(restOk('/admin/refresh', session()));
    await expect(ensureSession()).resolves.toBe('authenticated');
    expect(useAuthStore.getState().accessToken).toBe('at');
  });

  it('refresh 쿠키가 없으면 anonymous', async () => {
    server.use(restError('/admin/refresh', 401, '없음', 'MISSING_REFRESH_TOKEN'));
    await expect(ensureSession()).resolves.toBe('anonymous');
  });

  it('이미 아는 상태면 서버를 부르지 않는다', async () => {
    useAuthStore.getState().clear();
    let called = 0;
    server.use(
      http.post(`${AUTH_URL}/admin/refresh`, () => {
        called += 1;
        return HttpResponse.json(session());
      }),
    );
    await expect(ensureSession()).resolves.toBe('anonymous');
    expect(called).toBe(0);
  });

  it('login은 응답을 스토어에 넣는다', async () => {
    server.use(restOk('/admin/login', session(true)));
    await login('ops.admin', 'Password1!');
    expect(useAuthStore.getState()).toMatchObject({
      status: 'authenticated',
      mustChangePassword: true,
    });
  });

  it('logout은 서버가 401을 줘도 로컬을 비운다', async () => {
    useAuthStore.getState().setSession(session());
    server.use(restError('/admin/logout', 401, '만료', 'MISSING_REFRESH_TOKEN'));
    await logout();
    expect(useAuthStore.getState().status).toBe('anonymous');
  });

  it('changePassword 성공은 토큰을 붙여 보내고 로컬 세션을 비운다', async () => {
    useAuthStore.getState().setSession(session(true));
    let auth: string | null = null;
    server.use(
      http.post(`${AUTH_URL}/admin/change-password`, ({ request }) => {
        auth = request.headers.get('authorization');
        return HttpResponse.json({ ok: true });
      }),
    );
    await changePassword('Old1!old', 'New1!new');
    expect(auth).toBe('Bearer at');
    expect(useAuthStore.getState().status).toBe('anonymous');
  });

  it('changePassword의 현재 비밀번호 오류 401은 refresh 없이 세션을 유지한다', async () => {
    useAuthStore.getState().setSession(session());
    let refreshed = 0;
    server.use(
      restError(
        '/admin/change-password',
        401,
        '현재 비밀번호가 올바르지 않습니다.',
        'CURRENT_PASSWORD_INVALID',
      ),
      http.post(`${AUTH_URL}/admin/refresh`, () => {
        refreshed += 1;
        return HttpResponse.json(session());
      }),
    );
    await expect(changePassword('bad', 'New1!new')).rejects.toMatchObject({
      code: 'CURRENT_PASSWORD_INVALID',
    });
    expect(refreshed).toBe(0);
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('changePassword는 토큰 만료 401이면 갱신한 토큰으로 재시도해 성공한다', async () => {
    useAuthStore.getState().setSession(session(true));
    const auths: (string | null)[] = [];
    server.use(
      restOk('/admin/refresh', { ...session(true), accessToken: 'at2' }),
      http.post(`${AUTH_URL}/admin/change-password`, ({ request }) => {
        auths.push(request.headers.get('authorization'));
        return auths.length === 1
          ? HttpResponse.json(
              { message: '만료', code: 401, data: null, errorCode: 'INVALID_ACCESS_TOKEN' },
              { status: 401 },
            )
          : HttpResponse.json({ ok: true });
      }),
    );
    await changePassword('Old1!old', 'New1!new');
    expect(auths).toEqual(['Bearer at', 'Bearer at2']);
    expect(useAuthStore.getState().status).toBe('anonymous');
  });

  it('changePassword 중 refresh가 실패하면 anonymous가 된다', async () => {
    useAuthStore.getState().setSession(session(true));
    server.use(
      restError('/admin/change-password', 401, '만료', 'INVALID_ACCESS_TOKEN'),
      restError('/admin/refresh', 401, '만료', 'INVALID_REFRESH_TOKEN'),
    );
    await expect(changePassword('Old1!old', 'New1!new')).rejects.toMatchObject({
      code: 'INVALID_ACCESS_TOKEN',
    });
    expect(useAuthStore.getState()).toMatchObject({ status: 'anonymous', accessToken: null });
  });
});
