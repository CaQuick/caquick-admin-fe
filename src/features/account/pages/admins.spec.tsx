import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, graphql } from 'msw';
import { toast } from 'sonner';

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
  afterEach(() => vi.restoreAllMocks());

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
    expect(await screen.findByRole('cell', { name: 'ops.admin' })).toBeInTheDocument();
    expect(screen.getByText('(아이디 없음)')).toBeInTheDocument();
    expect(screen.getByText('전체 2명')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '관리자 추가' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: '추가' }));
    expect(
      await within(dialog).findByText(
        '아이디는 4~80자의 영문 소문자, 숫자, 마침표(.), 밑줄(_), 하이픈(-)으로 입력해 주세요.',
      ),
    ).toBeInTheDocument();
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

  it('아이디로 채우기: 8자 미만이면 비활성, 채우면 아이디와 같은 비밀번호로 추가', async () => {
    let created: unknown;
    server.use(
      gqlOk('AdminAdmins', {
        adminAdmins: { items: [], totalCount: 0, hasMore: false, nextCursor: null },
      }),
      graphql.mutation('AdminCreateAdmin', ({ variables }) => {
        created = (variables as { input: unknown }).input;
        return HttpResponse.json({
          data: { adminCreateAdmin: { accountId: '3', username: 'testadmin' } },
        });
      }),
    );
    boot();
    await userEvent.click(await screen.findByRole('button', { name: '관리자 추가' }));
    const dialog = await screen.findByRole('dialog');
    const fill = within(dialog).getByRole('button', { name: '아이디로 채우기' });
    await userEvent.type(within(dialog).getByLabelText('아이디'), 'ops.one');
    expect(fill).toBeDisabled();
    expect(fill).toHaveAccessibleDescription('아이디가 8자 이상이어야 쓸 수 있습니다.');

    await userEvent.clear(within(dialog).getByLabelText('아이디'));
    await userEvent.type(within(dialog).getByLabelText('아이디'), 'testadmin');
    await userEvent.click(fill);
    expect(within(dialog).getByLabelText('초기 비밀번호')).toHaveValue('testadmin');
    await userEvent.click(within(dialog).getByRole('button', { name: '추가' }));
    await vi.waitFor(() =>
      expect(created).toEqual({
        username: 'testadmin',
        password: 'testadmin',
        email: null,
        name: null,
      }),
    );
  });

  it('임시 비밀번호 생성으로 추가하면 만든 값을 보내고, 추가 토스트는 조사를 계정에 붙인다', async () => {
    let created: { password?: string } | undefined;
    const success = vi.spyOn(toast, 'success');
    server.use(
      gqlOk('AdminAdmins', {
        adminAdmins: { items: [], totalCount: 0, hasMore: false, nextCursor: null },
      }),
      graphql.mutation('AdminCreateAdmin', ({ variables }) => {
        created = (variables as { input: { password: string } }).input;
        return HttpResponse.json({
          data: { adminCreateAdmin: { accountId: '3', username: 'new.admin' } },
        });
      }),
    );
    boot();
    await userEvent.click(await screen.findByRole('button', { name: '관리자 추가' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByText(/첫 로그인 때 변경이 강제됩니다/)).not.toBeInTheDocument();
    await userEvent.type(within(dialog).getByLabelText('아이디'), 'new.admin');
    await userEvent.click(within(dialog).getByRole('button', { name: '임시 비밀번호 생성' }));
    const generated = within(dialog).getByLabelText<HTMLInputElement>('초기 비밀번호').value;
    expect(within(dialog).getByText(generated, { selector: 'code' })).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: '추가' }));
    await vi.waitFor(() => expect(created?.password).toBe(generated));
    await vi.waitFor(() =>
      expect(success).toHaveBeenCalledWith('new.admin 관리자 계정을 추가했습니다.'),
    );
  });

  it('비밀번호 초기화: 본인·아이디 없는 행은 사유와 함께 막고, 다른 관리자는 초기화 뒤 목록을 다시 받는다', async () => {
    let reset = false;
    let resetInput: unknown;
    let listCalls = 0;
    const success = vi.spyOn(toast, 'success');
    server.use(
      graphql.query('AdminAdmins', () => {
        listCalls += 1;
        return HttpResponse.json({
          data: {
            adminAdmins: {
              items: [
                admin('1', 'ops.admin'),
                admin('2', null),
                { ...admin('5', 'ops.five'), name: '김운영', mustChangePassword: reset },
              ],
              totalCount: 3,
              hasMore: false,
              nextCursor: null,
            },
          },
        });
      }),
      graphql.mutation('AdminResetAdminPassword', ({ variables }) => {
        resetInput = (variables as { input: unknown }).input;
        reset = true;
        return HttpResponse.json({ data: { adminResetAdminPassword: true } });
      }),
    );
    boot();
    await screen.findByRole('cell', { name: 'ops.five' });
    const row = (name: string) => screen.getByRole('cell', { name }).closest('tr')!;
    const selfButton = within(row('ops.admin')).getByRole('button', { name: '비밀번호 초기화' });
    expect(selfButton).toHaveAttribute('aria-disabled', 'true');
    expect(selfButton).toHaveAccessibleDescription(
      '본인 비밀번호는 비밀번호 변경 화면에서 바꿔 주세요.',
    );
    await userEvent.click(selfButton);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      within(row('(아이디 없음)')).getByRole('button', { name: '비밀번호 초기화' }),
    ).toHaveAccessibleDescription(
      '아이디가 없는 계정은 비밀번호로 로그인하지 않아 초기화할 수 없습니다.',
    );
    expect(within(row('ops.five')).queryByText('비밀번호 변경 필요')).toBeNull();

    await userEvent.click(within(row('ops.five')).getByRole('button', { name: '비밀번호 초기화' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading')).toHaveTextContent(
      '김운영(ops.five) 비밀번호 초기화',
    );
    expect(dialog).toHaveTextContent('관리자에게 전달해 주세요');
    await userEvent.click(within(dialog).getByRole('button', { name: '아이디로 채우기' }));
    await userEvent.click(within(dialog).getByRole('button', { name: '초기화' }));
    await vi.waitFor(() => expect(resetInput).toEqual({ accountId: '5', newPassword: 'ops.five' }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await within(row('ops.five')).findByText('비밀번호 변경 필요')).toBeInTheDocument();
    expect(listCalls).toBeGreaterThanOrEqual(2);
    expect(success).toHaveBeenCalledWith('김운영(ops.five)의 비밀번호를 초기화했습니다.');
  });

  it('본인 초기화 거절(CANNOT_RESET_OWN_PASSWORD)은 대화 상자 안에 BE 문구로', async () => {
    const message = '본인 비밀번호는 초기화할 수 없습니다. 비밀번호 변경을 이용해 주세요.';
    server.use(
      gqlOk('AdminAdmins', {
        adminAdmins: {
          items: [admin('5', 'ops.five')],
          totalCount: 1,
          hasMore: false,
          nextCursor: null,
        },
      }),
      gqlError('AdminResetAdminPassword', {
        message,
        code: 'CANNOT_RESET_OWN_PASSWORD',
        classification: 'FORBIDDEN',
        statusCode: 403,
      }),
    );
    boot();
    await userEvent.click(await screen.findByRole('button', { name: '비밀번호 초기화' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: '임시 비밀번호 생성' }));
    await userEvent.click(within(dialog).getByRole('button', { name: '초기화' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(message);
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
