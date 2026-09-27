import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { registerSessionHooks } from '@/shared/api';
import { restError, restOk } from '@/test/msw/graphql';
import { server } from '@/test/msw/server';

import { LoginForm } from './login-form';
import { installSessionHooks } from '../session';
import { useAuthStore } from '../store';

describe('LoginForm', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false });
    installSessionHooks();
  });
  afterEach(() =>
    registerSessionHooks({ getAccessToken: () => null, refresh: () => Promise.resolve(false) }),
  );

  it('형식이 틀리면 서버를 부르지 않고 필드 오류를 보여준다', async () => {
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);
    await userEvent.type(screen.getByLabelText('아이디'), 'ab');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'short');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));
    expect(await screen.findByText('아이디는 4자 이상입니다.')).toBeInTheDocument();
    expect(screen.getByText('비밀번호는 8자 이상입니다.')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('성공하면 mustChangePassword를 넘긴다', async () => {
    server.use(
      restOk('/admin/login', {
        accessToken: 'a',
        tokenType: 'Bearer',
        accountStatus: 'ACTIVE',
        mustChangePassword: true,
      }),
    );
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);
    await userEvent.type(screen.getByLabelText('아이디'), 'ops.admin');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));
    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ mustChangePassword: true }));
  });

  it('자격증명이 틀리면 한국어 오류를 보여준다', async () => {
    server.use(restError('/admin/login', 401, 'Invalid credentials', 'INVALID_CREDENTIALS'));
    render(<LoginForm onSuccess={vi.fn()} />);
    await userEvent.type(screen.getByLabelText('아이디'), 'ops.admin');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '아이디 또는 비밀번호가 올바르지 않습니다.',
    );
  });
});
