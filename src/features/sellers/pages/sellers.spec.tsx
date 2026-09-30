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
const seller = (accountId: string, status = 'ACTIVE') => ({
  accountId,
  username: `seller${accountId}`,
  email: null,
  name: '박사장',
  status,
  mustChangePassword: true,
  lastLoginAt: null,
  profile: {
    businessName: '루미 케이크',
    businessPhone: '02-555-0117',
    websiteUrl: 'https://lumi.test',
  },
  store: {
    id: '17',
    storeName: '루미 케이크',
    storePhone: '02-555-0118',
    addressFull: '서울',
    isActive: true,
  },
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

describe('판매자', () => {
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );
  afterEach(() => vi.restoreAllMocks());

  it('목록과 등록 링크', async () => {
    server.use(
      gqlOk('AdminSellers', {
        adminSellers: { items: [seller('20')], totalCount: 1, hasMore: false, nextCursor: null },
      }),
    );
    boot('/sellers');
    expect(await screen.findByText('seller20')).toBeInTheDocument();
    expect(screen.getByText('비밀번호 변경 필요')).toBeInTheDocument();
    // 매장명은 매장 상세로, 공개 여부는 노출/숨김 배지로(원시 #ID는 두지 않는다)
    expect(screen.getByRole('link', { name: '루미 케이크' })).toHaveAttribute('href', '/stores/17');
    expect(screen.getByText('노출')).toBeInTheDocument();
    expect(screen.queryByText(/#17/)).toBeNull();
    for (const header of ['최근 로그인', '등록일']) {
      expect(screen.getByRole('columnheader', { name: header })).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: '판매자 등록' })).toHaveAttribute(
      'href',
      '/sellers/new',
    );
  });

  it('등록 폼: 검증 오류 → 성공 시 상세로 이동', async () => {
    let input: Record<string, unknown> | undefined;
    server.use(
      graphql.mutation('AdminCreateSeller', ({ variables }) => {
        input = (variables as { input: Record<string, unknown> }).input;
        return HttpResponse.json({
          data: { adminCreateSeller: { accountId: '30', username: 'new.seller' } },
        });
      }),
      gqlOk('AdminSeller', { adminSeller: seller('30') }),
    );
    boot('/sellers/new');
    await userEvent.click(await screen.findByRole('button', { name: '판매자 등록' }));
    expect(await screen.findByText('사업자명은 필수입니다.')).toBeInTheDocument();
    expect(input).toBeUndefined();

    const fill = screen.getByRole('button', { name: '아이디로 채우기' });
    await userEvent.type(screen.getByLabelText(/^아이디/), 'seller7');
    expect(fill).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/^아이디/), 's');
    await userEvent.click(fill);
    expect(screen.getByLabelText(/^초기 비밀번호/)).toHaveValue('seller7s');
    await userEvent.type(screen.getByLabelText(/^사업자명/), '새 가게');
    await userEvent.type(screen.getByLabelText(/^사업자 전화/), '02-1');
    await userEvent.type(screen.getByLabelText(/^매장명/), '새 가게 본점');
    await userEvent.type(screen.getByLabelText(/^매장 전화/), '02-2');
    await userEvent.type(screen.getByLabelText(/^주소/), '서울 어딘가');
    await userEvent.click(screen.getByRole('button', { name: '판매자 등록' }));
    await vi.waitFor(() =>
      expect(input).toMatchObject({
        username: 'seller7s',
        password: 'seller7s',
        store: { storeName: '새 가게 본점', mapProvider: 'NONE', regionId: null },
      }),
    );
    expect(
      await screen.findByRole('heading', { level: 2, name: '박사장(seller30)' }),
    ).toBeInTheDocument();
  });

  it('등록 실패(중복 아이디)는 저장 버튼 옆과 토스트로 알린다', async () => {
    const error = vi.spyOn(toast, 'error');
    let input: Record<string, unknown> | undefined;
    server.use(
      graphql.mutation('AdminCreateSeller', ({ variables }) => {
        input = (variables as { input: Record<string, unknown> }).input;
        return undefined;
      }),
      gqlError('AdminCreateSeller', {
        message: '이미 쓰는 아이디',
        code: 'USERNAME_TAKEN',
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
    );
    boot('/sellers/new');
    await userEvent.type(await screen.findByLabelText(/^아이디/), 'dup.seller');
    await userEvent.click(screen.getByRole('button', { name: '임시 비밀번호 생성' }));
    const generated = screen.getByLabelText<HTMLInputElement>(/^초기 비밀번호/).value;
    expect(generated).toHaveLength(12);
    await userEvent.type(screen.getByLabelText(/^사업자명/), 'x');
    await userEvent.type(screen.getByLabelText(/^사업자 전화/), 'x');
    await userEvent.type(screen.getByLabelText(/^매장명/), 'x');
    await userEvent.type(screen.getByLabelText(/^매장 전화/), 'x');
    await userEvent.type(screen.getByLabelText(/^주소/), 'x');
    const submit = screen.getByRole('button', { name: '판매자 등록' });
    await userEvent.click(submit);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('이미 쓰는 아이디');
    expect(alert.parentElement).toBe(submit.parentElement);
    expect(error).toHaveBeenCalledWith('이미 쓰는 아이디');
    expect(input).toMatchObject({ password: generated });
  });

  it('상세: 라벨·링크, 비밀번호 초기화(확인 불일치 → 성공)와 정지 버튼', async () => {
    let resetInput: unknown;
    let detailCalls = 0;
    server.use(
      graphql.query('AdminSeller', () => {
        detailCalls += 1;
        return HttpResponse.json({ data: { adminSeller: seller('20') } });
      }),
      graphql.mutation('AdminResetSellerPassword', ({ variables }) => {
        resetInput = (variables as { input: unknown }).input;
        return HttpResponse.json({ data: { adminResetSellerPassword: true } });
      }),
    );
    boot('/sellers/20');
    expect(
      await screen.findByRole('heading', { level: 2, name: '박사장(seller20)' }),
    ).toBeInTheDocument();
    expect(screen.getByText('루미 케이크', { selector: 'dd' })).toBeInTheDocument(); // 사업자명
    expect(screen.getByRole('link', { name: '루미 케이크' })).toHaveAttribute('href', '/stores/17');
    expect(screen.getByText('노출')).toBeInTheDocument();
    expect(screen.getByText('비밀번호 변경 필요')).toBeInTheDocument();
    expect(
      decodeURIComponent(
        screen.getByRole('link', { name: '감사 이력' }).getAttribute('href') ?? '',
      ),
    ).toBe('/audit-logs?targetType=ACCOUNT&targetId=20');
    expect(screen.getByRole('link', { name: '목록으로' }).getAttribute('href')).toMatch(
      /^\/sellers(\?|$)/,
    );
    expect(screen.getByRole('button', { name: '계정 정지' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '비밀번호 초기화' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading')).toHaveTextContent(
      '박사장(seller20) 비밀번호 초기화',
    );
    expect(dialog).toHaveTextContent('판매자에게 전달해 주세요');
    expect(
      within(dialog).getByText(
        '8~64자로 정해 주세요. 받은 사람은 다음 로그인 때 비밀번호를 바꿔야 합니다.',
      ),
    ).toBeInTheDocument();
    await userEvent.type(within(dialog).getByLabelText(/^새 비밀번호 \*/), '12345678');
    await userEvent.type(within(dialog).getByLabelText(/^새 비밀번호 확인/), 'nope');
    await userEvent.click(within(dialog).getByRole('button', { name: '초기화' }));
    expect(await within(dialog).findByText('비밀번호가 서로 다릅니다.')).toBeInTheDocument();
    await userEvent.clear(within(dialog).getByLabelText(/^새 비밀번호 확인/));
    await userEvent.type(within(dialog).getByLabelText(/^새 비밀번호 확인/), '12345678');
    await userEvent.click(within(dialog).getByRole('button', { name: '초기화' }));
    await vi.waitFor(() =>
      expect(resetInput).toEqual({ accountId: '20', newPassword: '12345678' }),
    );
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await vi.waitFor(() => expect(detailCalls).toBeGreaterThanOrEqual(2));

    // 다시 열면 이전 입력은 비어 있고, 생성·아이디로 채우기는 확인 칸까지 채운다
    await userEvent.click(screen.getByRole('button', { name: '비밀번호 초기화' }));
    const again = await screen.findByRole('dialog');
    expect(within(again).getByLabelText(/^새 비밀번호 \*/)).toHaveValue('');
    await userEvent.click(within(again).getByRole('button', { name: '임시 비밀번호 생성' }));
    const generated = within(again).getByLabelText<HTMLInputElement>(/^새 비밀번호 \*/).value;
    expect(within(again).getByLabelText(/^새 비밀번호 확인/)).toHaveValue(generated);
    await userEvent.click(within(again).getByRole('button', { name: '아이디로 채우기' }));
    expect(within(again).getByLabelText(/^새 비밀번호 확인/)).toHaveValue('seller20');
    await userEvent.click(within(again).getByRole('button', { name: '초기화' }));
    await vi.waitFor(() =>
      expect(resetInput).toEqual({ accountId: '20', newPassword: 'seller20' }),
    );
  });

  it('없는 판매자는 NOT_FOUND와 목록 링크', async () => {
    server.use(
      gqlError('AdminSeller', {
        message: '판매자 없음',
        code: 'SELLER_NOT_FOUND',
        classification: 'NOT_FOUND',
        statusCode: 404,
      }),
    );
    boot('/sellers/999');
    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent(
      '판매자 없음',
    );
    expect(screen.getByRole('link', { name: '목록으로' })).toBeInTheDocument();
  });
});
