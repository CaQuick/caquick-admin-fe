import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { registerSessionHooks } from '@/shared/api';
import { restError, restOk } from '@/test/msw/graphql';
import { server } from '@/test/msw/server';

import { ChangePasswordForm } from './change-password-form';
import { installSessionHooks } from '../session';
import { useAuthStore } from '../store';

async function fill(current: string, next: string, confirm: string) {
  await userEvent.type(screen.getByLabelText('현재 비밀번호'), current);
  await userEvent.type(screen.getByLabelText('새 비밀번호'), next);
  await userEvent.type(screen.getByLabelText('새 비밀번호 확인'), confirm);
  await userEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));
}

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'authenticated', accessToken: 'at', mustChangePassword: true });
    installSessionHooks();
  });
  afterEach(() =>
    registerSessionHooks({ getAccessToken: () => null, refresh: () => Promise.resolve(false) }),
  );

  it('약한 비밀번호와 불일치를 필드별로 보여준다', async () => {
    render(<ChangePasswordForm onSuccess={vi.fn()} onSessionLost={vi.fn()} />);
    await fill('Current1!', 'weakweak', 'other');
    expect(await screen.findByText('숫자를 1자 이상 넣어 주세요.')).toBeInTheDocument();
    expect(screen.getByText('새 비밀번호가 서로 다릅니다.')).toBeInTheDocument();
  });

  it('성공하면 onSuccess', async () => {
    server.use(restOk('/admin/change-password', { ok: true }));
    const onSuccess = vi.fn();
    render(<ChangePasswordForm onSuccess={onSuccess} onSessionLost={vi.fn()} />);
    await fill('Current1!', 'Newpass1!', 'Newpass1!');
    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('현재 비밀번호가 틀리면 BE 메시지를 보여준다', async () => {
    server.use(
      restError(
        '/admin/change-password',
        401,
        '현재 비밀번호가 올바르지 않습니다.',
        'CURRENT_PASSWORD_INVALID',
      ),
    );
    render(<ChangePasswordForm onSuccess={vi.fn()} onSessionLost={vi.fn()} />);
    await fill('Wrong1!!', 'Newpass1!', 'Newpass1!');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '현재 비밀번호가 올바르지 않습니다.',
    );
  });

  it('refresh까지 실패해 세션을 잃으면 폼 대신 onSessionLost로 알린다', async () => {
    server.use(
      restError(
        '/admin/change-password',
        401,
        '액세스 토큰이 유효하지 않습니다.',
        'INVALID_ACCESS_TOKEN',
      ),
      restError('/admin/refresh', 401, '만료', 'INVALID_REFRESH_TOKEN'),
    );
    const onSessionLost = vi.fn();
    render(<ChangePasswordForm onSuccess={vi.fn()} onSessionLost={onSessionLost} />);
    await fill('Current1!', 'Newpass1!', 'Newpass1!');
    await vi.waitFor(() =>
      expect(onSessionLost).toHaveBeenCalledWith('세션이 만료되었습니다. 다시 로그인해 주세요.'),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
