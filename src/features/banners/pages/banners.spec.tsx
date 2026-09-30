import { act, render, screen, within } from '@testing-library/react';
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

  it('목록: 필터 라벨·노출 상태·슬롯별 현재 노출·삭제', async () => {
    let input: Record<string, unknown> | undefined;
    const visibleCursors: unknown[] = [];
    let deleted: unknown;
    const rows = [
      banner,
      { ...banner, id: '6', title: '두 번째', sortOrder: 3 },
      { ...banner, id: '7', title: '예약 배너', startsAt: '2099-01-01T00:00:00.000Z' },
      { ...banner, id: '8', title: '끝난 배너', endsAt: '2000-01-01T00:00:00.000Z' },
      { ...banner, id: '9', title: '숨긴 배너', isActive: false },
    ];
    server.use(
      graphql.query('AdminBanners', ({ variables }) => {
        input = (variables as { input: Record<string, unknown> }).input;
        return HttpResponse.json({
          data: {
            adminBanners: { items: rows, totalCount: 5, hasMore: false, nextCursor: null },
          },
        });
      }),
      // 노출 배너 전부를 페이지를 넘겨 가며 읽는다 — 두 번째 페이지의 5번이 현재 노출
      graphql.query('AdminBannersVisible', ({ variables }) => {
        const { cursor } = (variables as { input: { cursor: string | null } }).input;
        visibleCursors.push(cursor);
        const page = cursor === null ? [rows[1], rows[2], rows[3]] : [rows[0]];
        return HttpResponse.json({
          data: {
            adminBanners: {
              items: page,
              hasMore: cursor === null,
              nextCursor: cursor === null ? '6' : null,
            },
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
    expect(screen.getByRole('group', { name: '노출 여부' })).toHaveTextContent('노출');

    const statusOf = (title: string) =>
      within(screen.getByRole('link', { name: title }).closest('tr')!).getAllByRole('cell')[2]!
        .textContent;
    await vi.waitFor(() => expect(statusOf('가을 한정')).toBe('노출 중현재 노출'));
    expect(visibleCursors).toEqual([null, '6']);
    expect(statusOf('두 번째')).toBe('노출 중');
    expect(statusOf('예약 배너')).toBe('예약');
    expect(statusOf('끝난 배너')).toBe('종료');
    expect(statusOf('숨긴 배너')).toBe('숨김');

    await userEvent.click(screen.getByRole('button', { name: '가을 한정 삭제' }));
    await userEvent.click(await screen.findByRole('button', { name: '삭제' }));
    await vi.waitFor(() => expect(deleted).toEqual({ bannerId: '5' }));
  }, 15_000); // 앱 부팅부터 여러 단계를 한 번에 도는 흐름이라 기본 5초가 빠듯하다

  it('목록을 켜 둔 채 시작 시각이 되면 예약이 노출 중·현재 노출로 바뀐다', async () => {
    // 실제 시간도 흐르게 둬 부팅·요청은 그대로 진행되고, 시작 시각만 앞당겨 넘긴다
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const startsAt = new Date(Date.now() + 10 * 60_000).toISOString();
      const scheduled = { ...banner, id: '7', title: '예약 배너', startsAt };
      server.use(
        gqlOk('AdminBanners', {
          adminBanners: { items: [scheduled], totalCount: 1, hasMore: false, nextCursor: null },
        }),
        gqlOk('AdminBannersVisible', {
          adminBanners: { items: [scheduled], hasMore: false, nextCursor: null },
        }),
      );
      boot('/banners');
      const cell = async () =>
        within(
          (await screen.findByRole('link', { name: '예약 배너' })).closest('tr')!,
        ).getAllByRole('cell')[2]!;
      await vi.waitFor(async () => expect((await cell()).textContent).toBe('예약'));
      act(() => {
        vi.advanceTimersByTime(10 * 60_000);
      });
      await vi.waitFor(async () => expect((await cell()).textContent).toBe('노출 중현재 노출'));
    } finally {
      vi.useRealTimers();
    }
  });

  it('등록: 이미지 없으면 거절, 업로드 뒤 카테고리 배치는 이벤트 카테고리를 이름으로 골라 연결, 성공 시 상세로', async () => {
    let created: Record<string, unknown> | undefined;
    const categoryInputs: unknown[] = [];
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
      graphql.query('AdminBannerCategoryOptions', ({ variables }) => {
        categoryInputs.push((variables as { input: unknown }).input);
        return HttpResponse.json({
          data: {
            adminCategories: [
              { id: '41', name: '가을 이벤트', isActive: true },
              { id: '42', name: '숨긴 이벤트', isActive: false },
              { id: '43', name: '연말 이벤트', isActive: true },
            ],
          },
        });
      }),
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
    const replace = await screen.findByRole('button', { name: '이미지 바꾸기' });
    // 가로로 긴 배너라 미리보기를 카드 폭만큼 넓히고, 저장 줄은 좁은 화면에서도 이미지 카드 뒤에 둔다
    const preview = document.querySelector('img[src="https://cdn.test/new.png"]')!.parentElement;
    expect(preview).toHaveClass('w-full');
    expect(preview).not.toHaveClass('w-32');
    expect(
      replace.compareDocumentPosition(screen.getByRole('button', { name: '등록' })) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    await userEvent.click(
      within(screen.getByRole('radiogroup', { name: '배치' })).getByRole('radio', {
        name: '카테고리',
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: '등록' }));
    expect(
      await screen.findByText('카테고리 배치는 이벤트 카테고리로 연결해야 합니다.'),
    ).toBeInTheDocument();

    const linkGroup = screen.getByRole('radiogroup', { name: '링크 유형' });
    await userEvent.click(within(linkGroup).getByRole('radio', { name: '카테고리' }));
    await userEvent.click(screen.getByRole('button', { name: '등록' }));
    expect(await screen.findByText('연결할 대상을 골라 주세요.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('combobox', { name: /^이벤트 카테고리/ }));
    // 숨긴 카테고리는 연결할 수 없어 목록에서 뺀다
    expect(await screen.findByRole('option', { name: /연말 이벤트/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /숨긴 이벤트/ })).toBeNull();
    await userEvent.click(screen.getByRole('option', { name: /가을 이벤트/ }));
    expect(categoryInputs[0]).toEqual({ categoryType: 'EVENT' });
    expect(screen.getByRole('combobox', { name: /^이벤트 카테고리/ })).toHaveTextContent(
      '가을 이벤트',
    );
    expect(screen.queryByText('연결할 대상을 골라 주세요.')).toBeNull();
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

  it('링크 대상: 매장이 숨김인 상품은 후보에서 빼고, 숫자를 입력해도 ID로 고르는 항목을 두지 않는다', async () => {
    server.use(
      gqlOk('AdminBannerProductOptions', {
        adminProducts: {
          items: [
            { id: '3', name: '딸기 생크림 케이크', storeName: '루미 케이크', storeIsActive: true },
            { id: '4', name: '초코 타르트', storeName: '닫은 가게', storeIsActive: false },
          ],
        },
      }),
    );
    boot('/banners/new');
    const linkGroup = await screen.findByRole('radiogroup', { name: '링크 유형' });
    await userEvent.click(within(linkGroup).getByRole('radio', { name: '상품' }));
    await userEvent.click(screen.getByRole('combobox', { name: /^상품/ }));
    expect(await screen.findByRole('option', { name: /딸기 생크림 케이크/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /초코 타르트/ })).toBeNull();

    const searchBox = screen.getByRole('combobox', { name: '상품 검색' });
    expect(searchBox).toHaveAttribute('placeholder', '이름으로 검색');
    // 'ID로 선택' 항목은 입력 즉시 생기므로 검색 응답을 기다리지 않고 본다
    await userEvent.type(searchBox, '4');
    expect(screen.queryByRole('option', { name: /ID로 선택/ })).toBeNull();
    expect(screen.queryByRole('option', { name: /#4/ })).toBeNull();
  });

  it('수정: 저장된 링크 대상은 이름으로 보이고, 바뀐 것만 보낸다 / 저장 실패는 버튼 곁 오류와 토스트', async () => {
    let updated: unknown;
    const storeKeywords: unknown[] = [];
    server.use(
      gqlOk('AdminBanner', {
        adminBanner: { ...banner, linkType: 'PRODUCT', linkProductId: '3' },
      }),
      gqlOk('AdminBannerProductLabel', {
        adminProduct: { product: { id: '3', name: '딸기 생크림 케이크' } },
      }),
      graphql.query('AdminBannerStoreOptions', ({ variables }) => {
        const input = (variables as { input: { keyword: string | null } }).input;
        storeKeywords.push(input);
        const all = [
          { id: '17', storeName: '루미 케이크' },
          { id: '20', storeName: '달빛 베이커리' },
        ];
        return HttpResponse.json({
          data: {
            adminStores: { items: all.filter((x) => x.storeName.includes(input.keyword ?? '')) },
          },
        });
      }),
      graphql.mutation('AdminUpdateBanner', ({ variables }) => {
        updated = (variables as { input: unknown }).input;
        return HttpResponse.json({
          data: null,
          errors: [
            {
              message: '대상 매장이 없습니다.',
              extensions: {
                code: 'STORE_NOT_FOUND',
                classification: 'NOT_FOUND',
                statusCode: 404,
              },
            },
          ],
        });
      }),
    );
    boot('/banners/5');
    // 앞 테스트에서 본 목록 필터가 남아 있을 수 있다(목록 복귀는 마지막 필터로)
    expect(await screen.findByRole('link', { name: '목록으로' })).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/banners(\?|$)/),
    );
    expect(await screen.findByRole('combobox', { name: /^상품/ })).toHaveTextContent(
      '딸기 생크림 케이크',
    );
    expect(screen.getByLabelText('시작(한국 시간)')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: '매장' }));
    await userEvent.click(screen.getByRole('combobox', { name: /^매장/ }));
    await screen.findByRole('option', { name: /달빛 베이커리/ });
    await userEvent.type(screen.getByRole('combobox', { name: '매장 검색' }), '루미');
    await vi.waitFor(() => expect(screen.queryByRole('option', { name: /달빛/ })).toBeNull());
    await userEvent.click(screen.getByRole('option', { name: /루미 케이크/ }));
    expect(storeKeywords).toContainEqual({ keyword: '루미', isActive: true, limit: 20 });
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    await vi.waitFor(() =>
      expect(updated).toEqual({ bannerId: '5', linkType: 'STORE', linkStoreId: '17' }),
    );
    const alert = await screen.findByText('대상 매장이 없습니다.', {
      selector: 'p[role="alert"]',
    });
    // 저장 버튼 바로 위에 둔다
    expect(alert.nextElementSibling).toContainElement(screen.getByRole('button', { name: '저장' }));
    await vi.waitFor(() =>
      expect(document.querySelector('[data-sonner-toast][data-type="error"]')).toHaveTextContent(
        '대상 매장이 없습니다.',
      ),
    );
  });

  it('상세: 감사 이력 바로가기, 헤더의 삭제를 확인하면 지우고 목록으로 간다', async () => {
    let deleted: unknown;
    let detailReads = 0;
    server.use(
      graphql.query('AdminBanner', () => {
        detailReads++;
        return HttpResponse.json({ data: { adminBanner: banner } });
      }),
      graphql.mutation('AdminDeleteBanner', ({ variables }) => {
        deleted = variables;
        return HttpResponse.json({ data: { adminDeleteBanner: true } });
      }),
      gqlOk('AdminBanners', {
        adminBanners: { items: [], totalCount: 0, hasMore: false, nextCursor: null },
      }),
      gqlOk('AdminBannersVisible', {
        adminBanners: { items: [], hasMore: false, nextCursor: null },
      }),
    );
    boot('/banners/5');
    expect(await screen.findByRole('link', { name: '감사 이력' })).toHaveAttribute(
      'href',
      '/audit-logs?targetType=BANNER&targetId=5',
    );
    await userEvent.click(await screen.findByRole('button', { name: '삭제' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('되돌릴 수 없습니다');
    await userEvent.click(within(dialog).getByRole('button', { name: '삭제' }));
    await vi.waitFor(() => expect(deleted).toEqual({ bannerId: '5' }));
    expect(await screen.findByText('배너가 없습니다.')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/banners');
    // 지운 배너를 다시 읽지 않는다
    expect(detailReads).toBe(1);
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
