import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAuthStore } from '@/features/auth';
import { restError, restOk } from '@/test/msw/graphql';
import { server } from '@/test/msw/server';

import { App } from './app';

const session = (mustChangePassword = false) => ({
  accessToken: 'at',
  tokenType: 'Bearer' as const,
  accountStatus: 'ACTIVE' as const,
  mustChangePassword,
});

describe('App 라우팅 가드', () => {
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );

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
    expect(await screen.findByRole('button', { name: '로그아웃' })).toBeInTheDocument();
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
    expect(await screen.findByRole('button', { name: '로그아웃' })).toBeInTheDocument();
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
    await userEvent.click(await screen.findByRole('button', { name: '로그아웃' }));
    expect(await screen.findByText('관리자 로그인')).toBeInTheDocument();
  });

  it('없는 경로는 404', async () => {
    server.use(restOk('/admin/refresh', session()));
    window.history.pushState({}, '', '/nope');
    render(<App />);
    expect(await screen.findByText('페이지를 찾을 수 없습니다')).toBeInTheDocument();
  });
});
