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
const banner = {
  id: '5',
  placement: 'HOME_MAIN',
  title: '가을 한정',
  imageUrl: 'https://cdn.test/a.png',
  linkType: 'NONE',
  linkUrl: null,
  linkProductId: null,
  linkStoreId: null,
  linkCategoryId: null,
  startsAt: null,
  endsAt: null,
  sortOrder: 0,
  isActive: true,
  createdAt: 'x',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

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

describe('배너', () => {
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );

  it('목록 필터·삭제', async () => {
    let input: Record<string, unknown> | undefined;
    let deleted: unknown;
    server.use(
      graphql.query('AdminBanners', ({ variables }) => {
        input = (variables as { input: Record<string, unknown> }).input;
        return HttpResponse.json({
          data: {
            adminBanners: { items: [banner], totalCount: 1, hasMore: false, nextCursor: null },
          },
        });
      }),
      graphql.mutation('AdminDeleteBanner', ({ variables }) => {
        deleted = variables;
        return HttpResponse.json({ data: { adminDeleteBanner: true } });
      }),
    );
    boot('/banners?placement=HOME_MAIN&active=true');
    expect(await screen.findByRole('link', { name: '가을 한정' })).toHaveAttribute(
      'href',
      '/banners/5',
    );
    expect(input).toEqual({ limit: 20, cursor: null, placement: 'HOME_MAIN', isActive: true });
    await userEvent.click(screen.getByRole('button', { name: '가을 한정 삭제' }));
    await userEvent.click(await screen.findByRole('button', { name: '삭제' }));
    await vi.waitFor(() => expect(deleted).toEqual({ bannerId: '5' }));
  });

  it('등록: 이미지 없으면 거절, 업로드 뒤 카테고리 배치는 카테고리 링크 필수, 성공 시 상세로', async () => {
    let created: Record<string, unknown> | undefined;
    server.use(
      graphql.mutation('AdminCreateUploadUrl', () =>
        HttpResponse.json({
          data: {
            adminCreateUploadUrl: {
              uploadUrl: 'https://s3.test/put',
              publicUrl: 'https://cdn.test/new.png',
              key: 'k',
              expiresInSeconds: 60,
            },
          },
        }),
      ),
      graphql.mutation('AdminCreateBanner', ({ variables }) => {
        created = (variables as { input: Record<string, unknown> }).input;
        return HttpResponse.json({ data: { adminCreateBanner: { id: '9' } } });
      }),
      gqlOk('AdminBanner', { adminBanner: { ...banner, id: '9', title: '신규' } }),
    );
    // S3 PUT만 스텁 — 나머지 fetch는 원본(MSW가 가로챈다)으로. 스파이보다 먼저 원본을 잡아야 재귀가 없다
    const realFetch = globalThis.fetch.bind(globalThis);
    const putSpy = vi.spyOn(globalThis, 'fetch');
    boot('/banners/new');
    await userEvent.click(await screen.findByRole('button', { name: '등록' }));
    expect(await screen.findByText('이미지를 올려 주세요.')).toBeInTheDocument();

    const toHref = (u: RequestInfo | URL) =>
      typeof u === 'string' ? u : u instanceof URL ? u.href : u.url;
    putSpy.mockImplementation((url, init) =>
      toHref(url).startsWith('https://s3.test/')
        ? Promise.resolve(new Response(null, { status: 200 }))
        : realFetch(url, init),
    );
    const file = new File([new Uint8Array(10)], 'b.png', { type: 'image/png' });
    await userEvent.upload(document.querySelector<HTMLInputElement>('#bn-image')!, file);
    expect(await screen.findByRole('button', { name: '이미지 바꾸기' })).toBeInTheDocument();

    await userEvent.click(
      within(screen.getByRole('radiogroup', { name: '배치' })).getByRole('radio', {
        name: '카테고리',
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: '등록' }));
    expect(
      await screen.findByText('카테고리 배치는 이벤트 카테고리 링크가 필수입니다.'),
    ).toBeInTheDocument();

    const linkGroup = screen.getByRole('radiogroup', { name: '링크 유형' });
    await userEvent.click(within(linkGroup).getByRole('radio', { name: '카테고리' }));
    await userEvent.type(screen.getByLabelText('이벤트 카테고리 ID'), '41');
    await userEvent.type(screen.getByLabelText('제목'), '신규');
    await userEvent.click(screen.getByRole('button', { name: '등록' }));
    await vi.waitFor(() =>
      expect(created).toEqual({
        placement: 'CATEGORY',
        title: '신규',
        imageUrl: 'https://cdn.test/new.png',
        linkType: 'CATEGORY',
        linkCategoryId: '41',
        startsAt: null,
        endsAt: null,
        sortOrder: 0,
        isActive: true,
      }),
    );
    expect(await screen.findByRole('heading', { level: 2, name: '신규' })).toBeInTheDocument();
  });

  it('수정: 바뀐 것만 보낸다 / 저장 실패는 상단 오류', async () => {
    let updated: unknown;
    server.use(
      gqlOk('AdminBanner', { adminBanner: banner }),
      graphql.mutation('AdminUpdateBanner', ({ variables }) => {
        updated = (variables as { input: unknown }).input;
        return HttpResponse.json({
          data: null,
          errors: [
            {
              message: '대상 상품이 없습니다.',
              extensions: {
                code: 'PRODUCT_NOT_FOUND',
                classification: 'NOT_FOUND',
                statusCode: 404,
              },
            },
          ],
        });
      }),
    );
    boot('/banners/5');
    await userEvent.click(await screen.findByRole('radio', { name: '상품' }));
    await userEvent.type(screen.getByLabelText('상품 ID'), '99');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    await vi.waitFor(() =>
      expect(updated).toEqual({ bannerId: '5', linkType: 'PRODUCT', linkProductId: '99' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('대상 상품이 없습니다.');
  });

  it('없는 배너는 NOT_FOUND', async () => {
    server.use(
      gqlError('AdminBanner', {
        message: '배너 없음',
        code: 'BANNER_NOT_FOUND',
        classification: 'NOT_FOUND',
        statusCode: 404,
      }),
    );
    boot('/banners/404');
    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent('배너 없음');
  });
});
