import { QueryClient } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, graphql, http } from 'msw';

import { useAuthStore } from '@/features/auth';
import { AUTH_URL, refreshOnce } from '@/shared/api';
import { gqlOk, restError, restOk } from '@/test/msw/graphql';
import { server } from '@/test/msw/server';

import { App } from './app';

const session = (mustChangePassword = false) => ({
  accessToken: 'at',
  tokenType: 'Bearer' as const,
  accountStatus: 'ACTIVE' as const,
  mustChangePassword,
});

const me = {
  accountId: '1',
  username: 'ops.admin',
  email: null,
  name: null,
  status: 'ACTIVE',
  mustChangePassword: false,
  lastLoginAt: null,
  createdAt: '2026-09-27T00:00:00.000Z',
};

describe('App 라우팅 가드', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false });
    server.use(gqlOk('AdminMe', { adminMe: me }));
  });

  it('세션이 없으면 보호 경로에서 로그인으로 보낸다', async () => {
    server.use(restError('/admin/refresh', 401, '없음', 'MISSING_REFRESH_TOKEN'));
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(await screen.findByText('관리자 로그인')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  });

  it('refresh로 복원되면 홈을 보여준다', async () => {
    server.use(restOk('/admin/refresh', session()));
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: '대시보드' })).toBeInTheDocument();
  });

  it('비밀번호 변경이 강제된 계정은 변경 화면으로 보낸다', async () => {
    server.use(restOk('/admin/refresh', session(true)));
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(
      await screen.findByText('계속하려면 먼저 비밀번호를 바꿔야 합니다.'),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe('/change-password');
  });

  it('로그인된 상태로 /login에 오면 홈으로 보낸다', async () => {
    server.use(restOk('/admin/refresh', session()));
    window.history.pushState({}, '', '/login');
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: '대시보드' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
  });

  it('로그인 → 홈 → 로그아웃 → 로그인 화면', async () => {
    server.use(
      restError('/admin/refresh', 401, '없음', 'MISSING_REFRESH_TOKEN'),
      restOk('/admin/login', session()),
      restOk('/admin/logout', null, 204),
    );
    window.history.pushState({}, '', '/login?redirect=%2F');
    render(<App />);
    await userEvent.type(await screen.findByLabelText('아이디'), 'ops.admin');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));
    await userEvent.click(await screen.findByRole('button', { name: '내 계정' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: '로그아웃' }));
    expect(await screen.findByText('관리자 로그인')).toBeInTheDocument();
    expect(window.location.search).toBe('');
  });

  it('없는 경로는 404', async () => {
    server.use(restOk('/admin/refresh', session()));
    window.history.pushState({}, '', '/nope');
    render(<App />);
    expect(await screen.findByText('페이지를 찾을 수 없습니다')).toBeInTheDocument();
  });
});

describe('App 세션 상실', () => {
  /** 첫 refresh(부팅 복원)만 성공, 이후는 만료. */
  function refreshOnlyAtBoot(mustChangePassword = false) {
    const calls = { refresh: 0 };
    server.use(
      http.post(`${AUTH_URL}/admin/refresh`, () => {
        calls.refresh += 1;
        return calls.refresh === 1
          ? HttpResponse.json(session(mustChangePassword))
          : HttpResponse.json(
              { message: '만료', code: 401, data: null, errorCode: 'INVALID_REFRESH_TOKEN' },
              { status: 401 },
            );
      }),
    );
    return calls;
  }

  async function submitChangePassword() {
    await userEvent.type(await screen.findByLabelText('현재 비밀번호'), 'Current1!');
    await userEvent.type(screen.getByLabelText('새 비밀번호'), 'Newpass1!');
    await userEvent.type(screen.getByLabelText('새 비밀번호 확인'), 'Newpass1!');
    await userEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));
  }

  beforeEach(() => {
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false });
  });

  it('refresh가 실패하면 캐시를 비우고 현재 경로를 redirect로 담아 로그인으로 보낸다', async () => {
    refreshOnlyAtBoot();
    let meCalls = 0;
    server.use(
      graphql.query('AdminMe', () => {
        meCalls += 1;
        return HttpResponse.json({ data: { adminMe: me } });
      }),
      restOk('/admin/login', session()),
    );
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: '대시보드' })).toBeInTheDocument();
    await vi.waitFor(() => expect(meCalls).toBe(1));

    await act(() => refreshOnce());

    expect(await screen.findByText('관리자 로그인')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
    expect(new URLSearchParams(window.location.search).get('redirect')).toBe('/');

    await userEvent.type(screen.getByLabelText('아이디'), 'ops.admin');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));
    expect(await screen.findByRole('heading', { level: 1, name: '대시보드' })).toBeInTheDocument();
    // 캐시를 비웠으니 staleTime 안이어도 다시 조회한다
    await vi.waitFor(() => expect(meCalls).toBe(2));
  });

  it('현재 비밀번호 오류 401에는 refresh도 이동도 하지 않는다', async () => {
    const calls = refreshOnlyAtBoot();
    server.use(
      restError(
        '/admin/change-password',
        401,
        '현재 비밀번호가 올바르지 않습니다.',
        'CURRENT_PASSWORD_INVALID',
      ),
    );
    window.history.pushState({}, '', '/change-password');
    render(<App />);
    await submitChangePassword();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '현재 비밀번호가 올바르지 않습니다.',
    );
    expect(window.location.pathname).toBe('/change-password');
    expect(calls.refresh).toBe(1);
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('비밀번호 변경 화면에서는 세션이 비어도 이동은 화면에 맡기고 캐시는 비운다', async () => {
    refreshOnlyAtBoot(true);
    window.history.pushState({}, '', '/change-password');
    render(<App />);
    expect(await screen.findByLabelText('현재 비밀번호')).toBeInTheDocument();
    const clear = vi.spyOn(QueryClient.prototype, 'clear');
    act(() => useAuthStore.getState().clear());
    await new Promise((r) => setTimeout(r, 50));
    expect(window.location.pathname).toBe('/change-password');
    expect(clear).toHaveBeenCalledTimes(1);
    clear.mockRestore();
  });

  it('비밀번호 변경 성공은 redirect 없이 로그인으로 보낸다', async () => {
    refreshOnlyAtBoot(true);
    server.use(restOk('/admin/change-password', { ok: true }));
    window.history.pushState({}, '', '/change-password');
    render(<App />);
    await submitChangePassword();
    expect(await screen.findByText('관리자 로그인')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
    expect(window.location.search).toBe('');
  });

  it('비밀번호 변경 중 refresh가 실패하면 만료 안내와 함께 로그인으로 보낸다', async () => {
    refreshOnlyAtBoot(true);
    server.use(
      restError(
        '/admin/change-password',
        401,
        '액세스 토큰이 유효하지 않습니다.',
        'INVALID_ACCESS_TOKEN',
      ),
    );
    window.history.pushState({}, '', '/change-password');
    render(<App />);
    await submitChangePassword();
    expect(await screen.findByText('관리자 로그인')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
    expect(
      await screen.findByText('세션이 만료되었습니다. 다시 로그인해 주세요.'),
    ).toBeInTheDocument();
  });
});
