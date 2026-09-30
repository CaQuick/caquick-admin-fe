import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { App } from '@/app/app';
import { gqlOk, restOk } from '@/test/msw/graphql';
import { server } from '@/test/msw/server';

import { useAuthStore } from '../store';

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

function boot(path: string, mustChangePassword: boolean) {
  server.use(
    restOk('/admin/refresh', {
      accessToken: 'at',
      tokenType: 'Bearer',
      accountStatus: 'ACTIVE',
      mustChangePassword,
    }),
    gqlOk('AdminMe', { adminMe: me }),
    gqlOk('AdminAdmins', {
      adminAdmins: { items: [], totalCount: 0, hasMore: false, nextCursor: null },
    }),
  );
  window.history.pushState({}, '', path);
  render(<App />);
}

describe('비밀번호 변경 화면의 돌아가기', () => {
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );

  it('메뉴에서 스스로 들어오면 돌아가기로 보던 화면에 돌아간다', async () => {
    boot('/admins', false);
    await userEvent.click(await screen.findByRole('button', { name: '내 계정' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: '비밀번호 변경' }));
    expect(await screen.findByText('새 비밀번호를 설정합니다.')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/change-password');
    await userEvent.click(screen.getByRole('button', { name: '돌아가기' }));
    await vi.waitFor(() => expect(window.location.pathname).toBe('/admins'));
  });

  it('주소로 바로 들어오면 돌아갈 기록이 없어 홈으로 보낸다', async () => {
    boot('/change-password', false);
    await userEvent.click(await screen.findByRole('button', { name: '돌아가기' }));
    await vi.waitFor(() => expect(window.location.pathname).toBe('/'));
  });

  it('변경이 강제된 계정에는 돌아가기가 없다', async () => {
    boot('/change-password', true);
    expect(
      await screen.findByText('계속하려면 먼저 비밀번호를 바꿔야 합니다.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '돌아가기' })).not.toBeInTheDocument();
  });
});
