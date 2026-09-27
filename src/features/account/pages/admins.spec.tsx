import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, graphql } from 'msw';

import { App } from '@/app/app';
import { useAuthStore } from '@/features/auth';
import { gqlError, gqlOk, restOk } from '@/test/msw/graphql';
import { server } from '@/test/msw/server';

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
const admin = (accountId: string, username: string | null) => ({
  accountId,
  username,
  email: null,
  name: null,
  status: 'ACTIVE',
  mustChangePassword: username === null,
  lastLoginAt: null,
  createdAt: '2026-09-01T00:00:00.000Z',
});

function boot() {
  server.use(
    restOk('/admin/refresh', {
      accessToken: 'at',
      tokenType: 'Bearer',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
    }),
    gqlOk('AdminMe', { adminMe: me }),
  );
  window.history.pushState({}, '', '/admins');
  render(<App />);
}

describe('관리자 계정', () => {
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );

  it('목록·추가(검증 → 성공), 중복 아이디 오류', async () => {
    let created: unknown;
    let fail = true;
    server.use(
      gqlOk('AdminAdmins', {
        adminAdmins: {
          items: [admin('1', 'ops.admin'), admin('2', null)],
          totalCount: 2,
          hasMore: false,
          nextCursor: null,
        },
      }),
      graphql.mutation('AdminCreateAdmin', ({ variables }) => {
        created = (variables as { input: unknown }).input;
        if (fail) {
          fail = false;
          return HttpResponse.json({
            data: null,
            errors: [
              {
                message: '이미 쓰는 아이디',
                extensions: {
                  code: 'USERNAME_TAKEN',
                  classification: 'BAD_USER_INPUT',
                  statusCode: 400,
                },
              },
            ],
          });
        }
        return HttpResponse.json({
          data: { adminCreateAdmin: { accountId: '3', username: 'new.admin' } },
        });
      }),
    );
    boot();
    expect(await screen.findByText('ops.admin', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('(dev 계정)')).toBeInTheDocument();
    expect(screen.getByText('전체 2명')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '관리자 추가' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: '추가' }));
    expect(await within(dialog).findByText('4~80자, 소문자·숫자·. _ - 만')).toBeInTheDocument();
    await userEvent.type(within(dialog).getByLabelText('아이디'), 'new.admin');
    await userEvent.type(within(dialog).getByLabelText('초기 비밀번호'), 'Passw0rd!');
    await userEvent.click(within(dialog).getByRole('button', { name: '추가' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('이미 쓰는 아이디');
    expect(created).toEqual({
      username: 'new.admin',
      password: 'Passw0rd!',
      email: null,
      name: null,
    });
    await userEvent.click(within(dialog).getByRole('button', { name: '추가' }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('조회 실패는 오류 문구', async () => {
    server.use(
      gqlError('AdminAdmins', {
        message: '권한 없음',
        code: 'ACCOUNT_TYPE_NOT_ALLOWED',
        classification: 'FORBIDDEN',
        statusCode: 403,
      }),
    );
    boot();
    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent(
      '관리자 계정만 이용할 수 있습니다.',
    );
  });
});
