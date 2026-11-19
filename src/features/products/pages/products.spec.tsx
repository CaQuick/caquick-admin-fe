import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, graphql } from 'msw';

import { App } from '@/app/app';
import { useAuthStore } from '@/features/auth';
import { type AdminProductQuery, type CustomModeType } from '@/graphql/generated/graphql';
import { forgetSearches } from '@/shared/lib/list-return';
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
const product = (isActive = true) => ({
  id: '99',
  storeId: '17',
  storeName: '루미 케이크',
  name: '레터링 케이크',
  regularPrice: 45000,
  salePrice: 39000,
  currency: 'KRW',
  thumbnailUrl: 'https://img.test/thumb.png' as string | null,
  customMode: 'SLOT' as CustomModeType,
  isActive,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-02T00:00:00.000Z',
});

type Detail = AdminProductQuery['adminProduct'];
const detail = (over: Partial<Detail> = {}): Detail => ({
  product: product(),
  storeIsActive: false,
  description: '부드러운 생크림',
  purchaseNotice: null,
  preparationTimeMinutes: 120,
  imageUrls: ['https://img.test/1.png', 'https://img.test/2.png'],
  reviewCount: 8,
  orderItemCount: 55,
  categories: [],
  tags: [],
  optionGroups: [],
  customTemplate: null,
  ...over,
});
type Group = Detail['optionGroups'][number];
const group = (over: Partial<Group>): Group => ({
  id: '1',
  name: '그룹',
  description: null,
  isRequired: true,
  minSelect: 1,
  maxSelect: 1,
  sortOrder: 0,
  isActive: true,
  optionItems: [],
  ...over,
});
type Item = Group['optionItems'][number];
const item = (over: Partial<Item>): Item => ({
  id: '1',
  title: '선택지',
  description: null,
  imageUrl: null,
  priceDelta: 0,
  sortOrder: 0,
  isActive: true,
  threeDKey: null,
  ...over,
});
const RICH: Partial<Detail> = {
  categories: [
    { id: '1', categoryType: 'EVENT', name: '생일', isActive: true },
    { id: '2', categoryType: 'EVENT', name: '기념일', isActive: false },
    { id: '3', categoryType: 'STYLE', name: '레터링', isActive: true },
  ],
  tags: [{ id: '7', name: '비건' }],
  optionGroups: [
    group({
      id: '1',
      name: '사이즈',
      optionItems: [
        item({ id: '11', title: '1호' }),
        item({
          id: '12',
          title: '2호',
          description: '크림 두 배',
          imageUrl: 'https://img.test/o2.png',
          priceDelta: 8000,
        }),
        item({ id: '13', title: '미니', priceDelta: -3000, isActive: false }),
      ],
    }),
    group({
      id: '2',
      name: '토퍼',
      optionItems: [item({ id: '21', title: '금색', isActive: false })],
    }),
    group({
      id: '3',
      name: '사진 인쇄',
      description: '사진은 주문 뒤 채팅으로 보내 주세요.',
      isRequired: false,
      minSelect: 0,
      optionItems: [item({ id: '31', title: '사진 1장', priceDelta: 5000, threeDKey: 'heart' })],
    }),
    group({ id: '4', name: '초', isRequired: false, isActive: false }),
  ],
  customTemplate: {
    id: '5',
    baseImageUrl: 'https://img.test/tpl.png',
    freeEditEnabled: true,
    textTokens: [
      {
        id: '2',
        tokenKey: 'slot2',
        label: '보내는 사람',
        defaultText: '',
        maxLength: 10,
        sortOrder: 1,
        isRequired: false,
        textColor: 'not-a-color',
        textAlign: 'RIGHT',
      },
      {
        id: '1',
        tokenKey: 'slot1',
        label: '메인 문구',
        defaultText: 'HAPPY BIRTHDAY',
        maxLength: 20,
        sortOrder: 0,
        isRequired: true,
        textColor: '#FF5A5F',
        textAlign: 'CENTER',
      },
    ],
  },
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

describe('상품', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false });
    forgetSearches();
  });

  it('목록: 대표 이미지 썸네일, 판매가 첫 줄·정가 둘째 줄, 수정일 헤더', async () => {
    server.use(
      gqlOk('AdminProducts', {
        adminProducts: {
          items: [
            product(),
            { ...product(), id: '100', name: '생크림 케이크', salePrice: null, thumbnailUrl: null },
          ],
          totalCount: 2,
          hasMore: false,
          nextCursor: null,
        },
      }),
    );
    boot('/products');
    const row = (await screen.findByRole('link', { name: '레터링 케이크' })).closest('tr')!;
    expect(within(row).getByText('39,000원')).toBeInTheDocument();
    expect(within(row).getByText('45,000원').tagName).toBe('S');
    expect(within(row).getByText('45,000원').parentElement).toHaveTextContent('정가 45,000원');
    const plain = screen.getByRole('link', { name: '생크림 케이크' }).closest('tr')!;
    expect(within(plain).getByText('45,000원').tagName).not.toBe('S');
    expect(within(plain).queryByText(/정가/)).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '수정일' })).toBeInTheDocument();
    expect(row.querySelector('img')).toHaveAttribute('src', 'https://img.test/thumb.png');
    expect(plain.querySelector('img')).toBeNull();
  });

  it('목록: 매장 필터는 이름으로 검색해 고르고, 주소로 들어온 매장은 이름으로 보인다', async () => {
    const inputs: Record<string, unknown>[] = [];
    const storeSearches: Record<string, unknown>[] = [];
    server.use(
      graphql.query('AdminProducts', ({ variables }) => {
        const input = (variables as { input: Record<string, unknown> }).input;
        inputs.push(input);
        const items =
          input.storeId === '18'
            ? [{ ...product(), id: '7', storeId: '18', storeName: '달빛 베이커리', name: '마카롱' }]
            : [product()];
        return HttpResponse.json({
          data: { adminProducts: { items, totalCount: 1, hasMore: false, nextCursor: null } },
        });
      }),
      graphql.query('AdminProductStoreOptions', ({ variables }) => {
        const input = (variables as { input: Record<string, unknown> }).input;
        storeSearches.push(input);
        return HttpResponse.json({
          data: {
            adminStores: {
              items: [
                { id: '17', storeName: '루미 케이크', isActive: true },
                { id: '18', storeName: '달빛 베이커리', isActive: false },
              ],
            },
          },
        });
      }),
    );
    boot('/products?storeId=17&active=true');
    await screen.findByRole('link', { name: '레터링 케이크' });
    expect(inputs[0]).toMatchObject({ storeId: '17', isActive: true });
    const picker = screen.getByRole('combobox', { name: /^매장/ });
    expect(picker).toHaveTextContent('루미 케이크');
    expect(screen.getByRole('group', { name: '매장' })).toContainElement(picker);

    await userEvent.click(picker);
    await userEvent.type(screen.getByRole('combobox', { name: '매장 검색' }), '달빛');
    await vi.waitFor(() => expect(storeSearches).toContainEqual({ keyword: '달빛', limit: 20 }));
    await userEvent.click(
      await screen.findByRole('option', { name: /달빛 베이커리.*ID 18 · 숨김/ }),
    );
    await vi.waitFor(() => expect(inputs.at(-1)).toMatchObject({ storeId: '18', isActive: true }));
    expect(await screen.findByRole('link', { name: '마카롱' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /^매장/ })).toHaveTextContent('달빛 베이커리');
    expect(window.location.search).toContain('storeId=18');

    await userEvent.click(screen.getByRole('button', { name: '매장 선택 해제' }));
    await vi.waitFor(() => expect(inputs.at(-1)?.storeId).toBeNull());
    expect(screen.getByRole('combobox', { name: /^매장/ })).toHaveTextContent('전체 매장');
  });

  it('목록: 주소의 매장이 목록에 없으면 선택기는 #ID로 보인다', async () => {
    server.use(
      gqlOk('AdminProducts', {
        adminProducts: { items: [], totalCount: 0, hasMore: false, nextCursor: null },
      }),
    );
    boot('/products?storeId=0');
    expect(await screen.findByText('조건에 맞는 상품이 없습니다.')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /^매장/ })).toHaveTextContent('#0');
  });

  it('상세: 숨기기·다시 노출은 조사를 맞춘 문장으로 묻고 알린다', async () => {
    let active = true;
    const setInputs: unknown[] = [];
    server.use(
      graphql.query('AdminProduct', () =>
        HttpResponse.json({ data: { adminProduct: detail({ product: product(active) }) } }),
      ),
      graphql.mutation('AdminSetProductActive', ({ variables }) => {
        const input = (variables as { input: { isActive: boolean } }).input;
        setInputs.push(input);
        active = input.isActive;
        return HttpResponse.json({
          data: { adminSetProductActive: { id: '99', isActive: active } },
        });
      }),
    );
    boot('/products/99');
    expect(
      await screen.findByRole('heading', { level: 2, name: '레터링 케이크' }),
    ).toBeInTheDocument();
    expect(screen.getByText('매장 숨김')).toBeInTheDocument();
    expect(screen.getByText('이미지 2장')).toBeInTheDocument();
    expect(screen.getByText(/상품 ID 99 · 등록일 .+ · 수정일 /)).toBeInTheDocument();
    expect(screen.getByText('주문 건수(누적)')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '숨기기' }));
    let dialog = await screen.findByRole('dialog', { name: '레터링 케이크를 숨길까요?' });
    expect(dialog).toHaveTextContent('상품 내용은 판매자가 수정합니다.');
    await userEvent.type(within(dialog).getByLabelText(/^사유/), '규정 위반 이미지');
    await userEvent.click(within(dialog).getByRole('button', { name: '숨기기' }));
    await vi.waitFor(() =>
      expect(setInputs.at(-1)).toEqual({
        productId: '99',
        isActive: false,
        reason: '규정 위반 이미지',
      }),
    );
    expect(await screen.findByText('레터링 케이크를 숨겼습니다.')).toBeInTheDocument();

    await userEvent.click(await screen.findByRole('button', { name: '다시 노출' }));
    dialog = await screen.findByRole('dialog', { name: '레터링 케이크를 다시 노출할까요?' });
    expect(dialog).toHaveTextContent('매장이 숨김 상태라 매장을 다시 노출해야');
    await userEvent.click(within(dialog).getByRole('button', { name: '다시 노출' }));
    await vi.waitFor(() =>
      expect(setInputs.at(-1)).toEqual({ productId: '99', isActive: true, reason: null }),
    );
    expect(await screen.findByText('레터링 케이크를 다시 노출했습니다.')).toBeInTheDocument();
  });

  it('상세: 목록으로는 마지막에 본 목록 필터로 돌아간다', async () => {
    server.use(
      gqlOk('AdminProducts', {
        adminProducts: { items: [product()], totalCount: 1, hasMore: false, nextCursor: null },
      }),
      gqlOk('AdminProduct', {
        adminProduct: detail({ product: product(false), storeIsActive: true }),
      }),
    );
    boot('/products?active=true');
    await userEvent.click(await screen.findByRole('link', { name: '레터링 케이크' }));
    const back = await screen.findByRole('link', { name: '목록으로' });
    expect(back).toHaveAttribute('href', '/products?active=true');
    await userEvent.click(screen.getByRole('button', { name: '다시 노출' }));
    expect(
      await screen.findByRole('dialog', { name: '레터링 케이크를 다시 노출할까요?' }),
    ).toHaveTextContent('구매자 화면에 이 상품이 다시 보입니다.');
  });

  it('상세: 분류는 유형별 카테고리·태그를 관리 화면 링크로 보인다', async () => {
    server.use(gqlOk('AdminProduct', { adminProduct: detail(RICH) }));
    boot('/products/99');
    const card = (await screen.findByText('분류')).closest<HTMLElement>('[data-slot=card]')!;
    const terms = within(card)
      .getAllByRole('term')
      .map((t) => t.textContent);
    expect(terms).toEqual(['이벤트', '스타일', '태그']);
    expect(within(card).getByRole('link', { name: '생일' })).toHaveAttribute(
      'href',
      '/categories?type=EVENT',
    );
    const hidden = within(card).getByRole('link', { name: '기념일' });
    expect(hidden).toHaveAttribute('href', '/categories?type=EVENT&inactive=true');
    expect(hidden.closest('li')).toHaveTextContent('기념일숨김');
    expect(within(card).getByRole('link', { name: '레터링' })).toHaveAttribute(
      'href',
      '/categories?type=STYLE',
    );
    const tag = within(card).getByRole('link', { name: '비건' });
    expect(new URL(tag.getAttribute('href')!, 'http://x').pathname).toBe('/tags');
    expect(new URL(tag.getAttribute('href')!, 'http://x').searchParams.get('q')).toBe('비건');
  });

  it('상세: 옵션 그룹은 규칙·선택지·가격 증감·3D 연결 키와 주문 불가 경고를 보인다', async () => {
    server.use(gqlOk('AdminProduct', { adminProduct: detail(RICH) }));
    boot('/products/99');
    expect(await screen.findByText('옵션 그룹 4개')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      '옵션 구성 때문에 구매자가 이 상품을 주문할 수 없습니다.',
    );

    const size = screen.getByRole('listitem', { name: '옵션 그룹 사이즈' });
    expect(within(size).getByText('필수')).toBeInTheDocument();
    expect(within(size).getByText('1개 선택')).toBeInTheDocument();
    const rows = within(size)
      .getAllByRole('listitem')
      .map((li) => li.textContent);
    expect(rows).toEqual(['1호추가 금액 없음', '2호크림 두 배+8,000원', '미니숨김−3,000원']);
    expect(within(size).getByRole('img', { name: '2호 이미지' })).toHaveAttribute(
      'src',
      'https://img.test/o2.png',
    );
    expect(within(size).queryByText('주문 불가')).not.toBeInTheDocument();

    const topper = screen.getByRole('listitem', { name: '옵션 그룹 토퍼' });
    const blocked = within(topper).getByText('주문 불가').closest<HTMLElement>('[tabindex]')!;
    expect(blocked).toHaveAccessibleDescription(
      '필수 그룹에 노출 중인 선택지가 없어 구매자가 이 상품을 주문할 수 없습니다.',
    );
    await userEvent.hover(blocked);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      '필수 그룹에 노출 중인 선택지가 없어',
    );
    await userEvent.unhover(blocked);

    const photo = screen.getByRole('listitem', { name: '옵션 그룹 사진 인쇄' });
    expect(within(photo).getByText('선택 사항')).toBeInTheDocument();
    expect(within(photo).getByText('최대 1개 선택')).toBeInTheDocument();
    expect(within(photo).getByText('사진은 주문 뒤 채팅으로 보내 주세요.')).toBeInTheDocument();
    expect(within(photo).getAllByRole('listitem')[0]).toHaveTextContent('사진 1장3D heart+5,000원');
    expect(within(size).queryByText(/^3D /)).not.toBeInTheDocument();
    // 옵션 입력 플래그가 없어져 입력 필요 경고는 더 이상 없다
    expect(screen.queryByText(/입력 필요/)).not.toBeInTheDocument();

    const candle = screen.getByRole('listitem', { name: '옵션 그룹 초' });
    expect(within(candle).getByText('숨김')).toBeInTheDocument();
    expect(within(candle).getByText('선택지가 없습니다.')).toBeInTheDocument();
    expect(within(candle).queryByText('주문 불가')).not.toBeInTheDocument();
  });

  it('상세: 커스텀 설정은 방식·자유 편집과 문구 자리 스타일을 순서대로 보인다', async () => {
    server.use(gqlOk('AdminProduct', { adminProduct: detail(RICH) }));
    boot('/products/99');
    const card = (await screen.findByText('커스텀 설정')).closest<HTMLElement>('[data-slot=card]')!;
    expect(
      within(card)
        .getAllByRole('term')
        .map((t) => t.textContent),
    ).toEqual(['커스텀 방식', '자유 편집']);
    expect(
      within(card)
        .getAllByRole('definition')
        .map((d) => d.textContent),
    ).toEqual(['슬롯형', '허용']);
    expect(within(card).getByRole('img', { name: '템플릿 바탕 이미지' })).toHaveAttribute(
      'src',
      'https://img.test/tpl.png',
    );
    const [header, main, sender] = within(card).getAllByRole('row');
    expect(header).toHaveTextContent('문구 자리기본 문구최대 글자 수필수 입력글자색정렬');
    expect(main).toHaveTextContent('메인 문구slot1HAPPY BIRTHDAY20자필수#FF5A5F가운데');
    expect(sender).toHaveTextContent('보내는 사람slot2—10자선택not-a-color오른쪽');
    expect(main!.querySelector('[data-slot=color-swatch]')).toHaveStyle(
      'background-color: rgb(255, 90, 95)',
    );
    expect(sender!.querySelector('[data-slot=color-swatch]')).not.toHaveAttribute('style');
    expect(within(card).queryByText(/구매자에게 보이지 않습니다/)).not.toBeInTheDocument();
  });

  const THREE_D_NOTE =
    '모양·크기·맛·디자인은 옵션 선택지의 3D 연결로 고릅니다. 3D 상품에는 자유 편집이 없습니다.';
  const UNUSED_NOTE = '커스텀 방식이 슬롯형이 아니라 이 템플릿은 구매자에게 보이지 않습니다.';
  it.each([
    ['3D는 옵션 3D 연결 안내만 보인다', 'THREE_D', null, ['3D'], [THREE_D_NOTE]],
    [
      '슬롯형인데 템플릿이 없으면 없다고 알린다',
      'SLOT',
      null,
      ['슬롯형'],
      ['등록된 템플릿이 없습니다.'],
    ],
    ['방식이 없고 템플릿도 없으면 방식만 보인다', 'NONE', null, ['없음'], []],
    [
      '슬롯형이 아닌데 남은 템플릿은 구매자에게 보이지 않는다고 알린다',
      'NONE',
      { ...RICH.customTemplate!, freeEditEnabled: false },
      ['없음'],
      [UNUSED_NOTE, '템플릿 자유 편집: 허용 안 함'],
    ],
    [
      '3D에 남은 템플릿의 자유 편집 허용은 방식 아래가 아니라 남은 템플릿 안내에 보인다',
      'THREE_D',
      RICH.customTemplate!,
      ['3D'],
      [THREE_D_NOTE, UNUSED_NOTE, '템플릿 자유 편집: 허용'],
    ],
  ] as const)('상세: 커스텀 설정 — %s', async (_, customMode, customTemplate, defs, notes) => {
    server.use(
      gqlOk('AdminProduct', {
        adminProduct: detail({ product: { ...product(), customMode }, customTemplate }),
      }),
    );
    boot('/products/99');
    const card = (await screen.findByText('커스텀 설정')).closest<HTMLElement>('[data-slot=card]')!;
    expect(
      within(card)
        .getAllByRole('definition')
        .map((d) => d.textContent),
    ).toEqual(defs);
    expect([...card.querySelectorAll('p')].map((p) => p.textContent)).toEqual(notes);
  });

  it('상세: 분류·옵션·템플릿이 없으면 없다고 알린다', async () => {
    server.use(gqlOk('AdminProduct', { adminProduct: detail() }));
    boot('/products/99');
    expect(await screen.findByText('등록된 옵션이 없습니다.')).toBeInTheDocument();
    expect(screen.getByText('옵션 그룹 0개')).toBeInTheDocument();
    expect(screen.getByText('등록된 템플릿이 없습니다.')).toBeInTheDocument();
    const card = screen.getByText('분류').closest<HTMLElement>('[data-slot=card]')!;
    expect(
      within(card)
        .getAllByRole('definition')
        .map((d) => d.textContent),
    ).toEqual(['없음', '없음']);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('없는 상품은 NOT_FOUND', async () => {
    server.use(
      gqlError('AdminProduct', {
        message: '상품 없음',
        code: 'PRODUCT_NOT_FOUND',
        classification: 'NOT_FOUND',
        statusCode: 404,
      }),
    );
    boot('/products/1');
    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent('상품 없음');
    expect(screen.getByRole('link', { name: '목록으로' })).toHaveAttribute('href', '/products');
  });
});
