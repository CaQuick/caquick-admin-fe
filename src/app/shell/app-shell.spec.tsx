import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';

import { useAuthStore } from '@/features/auth';
import { useThemeStore } from '@/shared/theme';
import { gqlOk, restOk } from '@/test/msw/graphql';
import { server } from '@/test/msw/server';

import { App } from '../app';

const me = {
  accountId: '1',
  username: 'ops.admin',
  email: 'ops@caquick.site',
  name: '운영',
  status: 'ACTIVE',
  mustChangePassword: false,
  lastLoginAt: null,
  createdAt: '2026-09-27T00:00:00.000Z',
};

function boot(path = '/') {
  server.use(
    restOk('/admin/refresh', {
      accessToken: 'at',
      tokenType: 'Bearer',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
    }),
    gqlOk('AdminMe', { adminMe: me }),
  );
  window.history.pushState({}, '', path);
  render(<App />);
}

describe('AppShell', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false });
    useThemeStore.setState({ theme: 'system', resolved: 'light' });
    document.documentElement.classList.remove('dark');
  });

  it('사이드바 메뉴·페이지 제목·내 계정을 보여준다', async () => {
    boot();
    const nav = await screen.findByRole('navigation', { name: '주 메뉴' });
    expect(within(nav).getByRole('link', { name: '대시보드' })).toHaveAttribute(
      'data-status',
      'active',
    );
    expect(screen.getByRole('heading', { level: 1, name: '대시보드' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: '내 계정' })).toHaveTextContent('ops.admin');
  });

  it('테마 메뉴에서 다크를 고르면 .dark가 붙는다', async () => {
    boot();
    await userEvent.click(await screen.findByRole('button', { name: '테마 변경' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: '다크' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('내 계정 메뉴의 로그아웃은 로그인 화면으로 보낸다', async () => {
    server.use(restOk('/admin/logout', null, 204));
    boot();
    await userEvent.click(await screen.findByRole('button', { name: '내 계정' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: '로그아웃' }));
    expect(await screen.findByText('관리자 로그인')).toBeInTheDocument();
  });

  it('내 계정 메뉴의 비밀번호 변경은 셸 밖 변경 화면으로 간다', async () => {
    boot();
    await userEvent.click(await screen.findByRole('button', { name: '내 계정' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: '비밀번호 변경' }));
    expect(await screen.findByText('새 비밀번호를 설정합니다.')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: '주 메뉴' })).not.toBeInTheDocument();
  });

  it('모바일 메뉴 버튼은 시트를 연다', async () => {
    boot();
    await userEvent.click(await screen.findByRole('button', { name: '메뉴 열기' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
