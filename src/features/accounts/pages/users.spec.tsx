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
const user = (accountId: string, status = 'ACTIVE') => ({
  accountId,
  email: `u${accountId}@test.dev`,
  name: '김서연',
  status,
  nickname: `seo${accountId}`,
  phoneNumber: '010-1111-2222',
  onboardingCompleted: true,
  identityProviders: ['KAKAO'],
  orderCount: 3,
  reviewCount: 1,
  createdAt: '2026-09-01T00:00:00.000Z',
});

function boot(path: string) {
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

describe('구매자', () => {
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );

  it('목록은 키워드·상태 필터를 요청에 반영한다', async () => {
    const inputs: Record<string, unknown>[] = [];
    server.use(
      graphql.query('AdminUsers', ({ variables }) => {
        inputs.push((variables as { input: Record<string, unknown> }).input);
        return HttpResponse.json({
          data: {
            adminUsers: {
              items: [user('10'), user('11', 'SUSPENDED')],
              totalCount: 2,
              hasMore: false,
              nextCursor: null,
            },
          },
        });
      }),
    );
    boot('/users?status=SUSPENDED');
    expect(await screen.findByText('seo10')).toBeInTheDocument();
    expect(screen.getByText('전체 2명')).toBeInTheDocument();
    expect(inputs[0]).toMatchObject({ status: 'SUSPENDED', keyword: null });
    await userEvent.type(screen.getByRole('textbox', { name: '검색어' }), 'seo{enter}');
    await vi.waitFor(() =>
      expect(inputs.at(-1)).toMatchObject({ keyword: 'seo', status: 'SUSPENDED' }),
    );
  });

  it('상세에서 정지(사유 필수) → 복구까지 왕복하고 캐시를 갱신한다', async () => {
    let status = 'ACTIVE';
    let suspendInput: unknown;
    let reinstateVars: unknown;
    server.use(
      graphql.query('AdminUser', () =>
        HttpResponse.json({ data: { adminUser: user('10', status) } }),
      ),
      graphql.mutation('AdminSuspendAccount', ({ variables }) => {
        suspendInput = (variables as { input: unknown }).input;
        status = 'SUSPENDED';
        return HttpResponse.json({
          data: { adminSuspendAccount: { accountId: '10', accountType: 'USER', status } },
        });
      }),
      graphql.mutation('AdminReinstateAccount', ({ variables }) => {
        reinstateVars = variables;
        status = 'ACTIVE';
        return HttpResponse.json({
          data: { adminReinstateAccount: { accountId: '10', accountType: 'USER', status } },
        });
      }),
    );
    boot('/users/10');
    expect(await screen.findByRole('heading', { level: 2, name: 'seo10' })).toBeInTheDocument();
    // 검색 파라미터는 따옴표 없이 쓴다(앱 라우터의 search 직렬화)
    expect(
      decodeURIComponent(
        screen.getByRole('link', { name: '주문 보기' }).getAttribute('href') ?? '',
      ),
    ).toBe('/orders?accountId=10');

    await userEvent.click(screen.getByRole('button', { name: '계정 정지' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: '계정 정지' })).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText('정지 사유 (필수)'), ' 욕설 신고 누적 ');
    await userEvent.click(within(dialog).getByRole('button', { name: '계정 정지' }));
    await vi.waitFor(() =>
      expect(suspendInput).toEqual({ accountId: '10', reason: '욕설 신고 누적' }),
    );
    expect(await screen.findByRole('button', { name: '정지 해제' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '정지 해제' }));
    await userEvent.click(await screen.findByRole('button', { name: '복구' }));
    await vi.waitFor(() => expect(reinstateVars).toEqual({ accountId: '10' }));
    expect(await screen.findByRole('button', { name: '계정 정지' })).toBeInTheDocument();
  });

  it('정지 실패는 토스트, 없는 계정은 NOT_FOUND', async () => {
    server.use(
      gqlOk('AdminUser', { adminUser: user('10') }),
      gqlError('AdminSuspendAccount', {
        message: '본인은 정지할 수 없습니다.',
        code: 'CANNOT_SUSPEND_SELF',
        classification: 'FORBIDDEN',
        statusCode: 403,
      }),
    );
    boot('/users/10');
    await userEvent.click(await screen.findByRole('button', { name: '계정 정지' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('정지 사유 (필수)'), '사유');
    await userEvent.click(within(dialog).getByRole('button', { name: '계정 정지' }));
    expect(await screen.findByText('본인은 정지할 수 없습니다.')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('없는 계정은 NOT_FOUND와 목록 링크', async () => {
    server.use(
      gqlError('AdminUser', {
        message: '계정 없음',
        code: 'ACCOUNT_NOT_FOUND',
        classification: 'NOT_FOUND',
        statusCode: 404,
      }),
    );
    boot('/users/999');
    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent('계정 없음');
    expect(screen.getByRole('link', { name: '목록으로' })).toHaveAttribute('href', '/users');
  });
});
