import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, graphql } from 'msw';

import { App } from '@/app/app';
import { useAuthStore } from '@/features/auth';
import { resetNaverMapsForTest } from '@/shared/lib/naver-maps';
import { installFakeNaverMaps, installFakePostcode, postcodeResult } from '@/test/fakes';
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
const row = {
  id: '17',
  sellerAccountId: '20',
  sellerLabel: '박사장(seller20)',
  storeName: '루미 케이크',
  storePhone: '02-1',
  addressFull: '서울 강남구 테헤란로 1',
  regionId: '5',
  isActive: true,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-02T00:00:00.000Z',
};
const region = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  parentId: null,
  level: 1,
  name: '',
  slug: '',
  sortOrder: 0,
  isActive: true,
  centerLat: null,
  centerLng: null,
  storeCount: 0,
  childCount: 0,
  createdAt: 'x',
  updatedAt: 'y',
  ...over,
});
const regions = [
  region('1', { name: '서울', slug: 'seoul', childCount: 1 }),
  region('2', { name: '경기', slug: 'gyeonggi', childCount: 1 }),
  region('5', { parentId: '1', level: 2, name: '강남구', slug: 'sgg-11680', storeCount: 3 }),
  region('6', { parentId: '1', level: 2, name: '종로구', slug: 'sgg-11110', isActive: false }),
  region('7', { parentId: '2', level: 2, name: '성남시 분당구', slug: 'sgg-41135' }),
];
const detail = (isActive = true, over: Record<string, unknown> = {}) => ({
  store: {
    ...row,
    isActive,
    addressCity: '서울',
    addressDistrict: '강남구',
    addressNeighborhood: null,
    latitude: '37.5',
    longitude: '127.0',
    mapProvider: 'NAVER',
    websiteUrl: null,
    businessHoursText: '10:00-20:00',
    profileImageUrl: null,
    greetingMessage: null,
    pickupSlotIntervalMinutes: 30,
    minLeadTimeMinutes: 60,
    maxDaysAhead: 14,
    ...over,
  },
  seller: { accountId: '20', username: 'seller20', email: null, name: '박사장', status: 'ACTIVE' },
  productCount: 12,
  orderItemCount: 340,
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
    gqlOk('AdminRegions', { adminRegions: regions }),
  );
  window.history.pushState({}, '', path);
  render(<App />);
}

/** 수정 탭을 열고 저장 요청 입력을 잡는다 */
async function openEdit(store = detail()) {
  const saved: { input?: Record<string, unknown> } = {};
  server.use(
    gqlOk('AdminStore', { adminStore: store }),
    graphql.mutation('AdminUpdateStoreBasicInfo', ({ variables }) => {
      saved.input = (variables as { input: Record<string, unknown> }).input;
      return HttpResponse.json({
        data: { adminUpdateStoreBasicInfo: { id: '17', updatedAt: 'z' } },
      });
    }),
  );
  boot('/stores/17');
  await userEvent.click(await screen.findByRole('tab', { name: '기본 정보 수정' }));
  await screen.findByLabelText(/^매장명/);
  return saved;
}

function geocodeReturns(result: Record<string, unknown> | null) {
  const queries: string[] = [];
  server.use(
    graphql.query('AdminGeocodeAddress', ({ variables }) => {
      queries.push((variables as { query: string }).query);
      return HttpResponse.json({ data: { adminGeocodeAddress: result } });
    }),
  );
  return queries;
}

async function searchAddress() {
  await userEvent.click(screen.getByRole('button', { name: '주소 검색' }));
  const dialog = await screen.findByRole('dialog', { name: '주소 검색' });
  await userEvent.click(await within(dialog).findByRole('button', { name: /로|동/ }));
}

const districtPicker = () => screen.getByRole('combobox', { name: '지역 시·군·구' });
const GEOCODED = '주소로 좌표를 채웠습니다. 지도에서 핀 위치를 확인해 주세요.';

describe('매장', () => {
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );
  afterEach(() => {
    delete window.kakao;
    delete window.naver;
    vi.unstubAllEnvs();
    resetNaverMapsForTest();
  });

  it('목록: 노출 필터를 boolean으로 보내고, 지역은 이름·판매자는 라벨로 보여 준다', async () => {
    let input: Record<string, unknown> | undefined;
    server.use(
      graphql.query('AdminStores', ({ variables }) => {
        input = (variables as { input: Record<string, unknown> }).input;
        return HttpResponse.json({
          data: {
            adminStores: {
              items: [row, { ...row, id: '18', storeName: '빈 라벨', sellerLabel: null }],
              totalCount: 2,
              hasMore: false,
              nextCursor: null,
            },
          },
        });
      }),
    );
    boot('/stores?active=false&regionId=5');
    expect(await screen.findByRole('link', { name: '루미 케이크' })).toHaveAttribute(
      'href',
      '/stores/17',
    );
    expect(input).toMatchObject({ isActive: false, regionId: '5', keyword: null });
    expect(screen.getByRole('link', { name: '박사장(seller20)' })).toHaveAttribute(
      'href',
      '/sellers/20',
    );
    // 라벨이 없으면 ID로
    expect(screen.getByRole('link', { name: '#20' })).toHaveAttribute('href', '/sellers/20');
    expect(await screen.findAllByText('서울 강남구')).toHaveLength(2);
    expect(screen.getByText('전체 2곳')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '노출 여부' })).toHaveTextContent('숨김');
    // 지역 필터는 선택기가 현재 값을 보여 준다
    expect(districtPicker()).toHaveTextContent('강남구');
    expect(screen.getByRole('combobox', { name: '지역 권역' })).toHaveTextContent('서울');
  });

  it('목록: 지역 선택기로 권역 → 시·군·구를 고르면 regionId로 거르고, 해제하면 뺀다', async () => {
    const inputs: Record<string, unknown>[] = [];
    server.use(
      graphql.query('AdminStores', ({ variables }) => {
        inputs.push((variables as { input: Record<string, unknown> }).input);
        return HttpResponse.json({
          data: { adminStores: { items: [row], totalCount: 1, hasMore: false, nextCursor: null } },
        });
      }),
    );
    boot('/stores');
    await screen.findByRole('link', { name: '루미 케이크' });
    expect(districtPicker()).toBeDisabled();

    await userEvent.click(screen.getByRole('combobox', { name: '지역 권역' }));
    await userEvent.click(await screen.findByRole('option', { name: '서울' }));
    await userEvent.click(districtPicker());
    // 목록 필터는 숨긴 지역도 고를 수 있다(이미 연결된 매장을 찾을 때)
    expect(await screen.findByRole('option', { name: '종로구 (숨김)' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('option', { name: '강남구' }));
    await vi.waitFor(() => expect(inputs.at(-1)).toMatchObject({ regionId: '5' }));
    expect(window.location.search).toContain('regionId=5');

    await userEvent.click(screen.getByRole('button', { name: '지역 선택 해제' }));
    await vi.waitFor(() => expect(window.location.search).not.toContain('regionId'));
    // 권역은 남겨 두어 다른 시·군·구를 바로 고를 수 있다
    expect(districtPicker()).toHaveTextContent('시·군·구');
  });

  it('상세: 숨기기(사유 선택) → 다시 노출, 수정 탭은 바뀐 필드만 저장', async () => {
    let active = true;
    let setInput: unknown;
    let updateInput: unknown;
    server.use(
      graphql.query('AdminStore', () =>
        HttpResponse.json({ data: { adminStore: detail(active) } }),
      ),
      graphql.mutation('AdminSetStoreActive', ({ variables }) => {
        setInput = (variables as { input: { isActive: boolean } }).input;
        active = (variables as { input: { isActive: boolean } }).input.isActive;
        return HttpResponse.json({ data: { adminSetStoreActive: { id: '17', isActive: active } } });
      }),
      graphql.mutation('AdminUpdateStoreBasicInfo', ({ variables }) => {
        updateInput = (variables as { input: unknown }).input;
        return HttpResponse.json({
          data: { adminUpdateStoreBasicInfo: { id: '17', updatedAt: 'z' } },
        });
      }),
    );
    boot('/stores/17');
    expect(
      await screen.findByRole('heading', { level: 2, name: '루미 케이크' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/^340건/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '매장 숨기기' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('루미 케이크를 숨길까요?');
    await userEvent.click(within(dialog).getByRole('button', { name: '숨기기' }));
    await vi.waitFor(() =>
      expect(setInput).toEqual({ storeId: '17', isActive: false, reason: null }),
    );
    expect(await screen.findByRole('button', { name: '매장 다시 노출' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: '기본 정보 수정' }));
    const name = await screen.findByLabelText(/^매장명/);
    await userEvent.clear(name);
    await userEvent.type(name, '루미 케이크 본점');
    await userEvent.clear(screen.getByLabelText('시/군/구'));
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    await vi.waitFor(() =>
      expect(updateInput).toEqual({
        storeId: '17',
        storeName: '루미 케이크 본점',
        addressDistrict: null,
      }),
    );
  });

  it('상세 개요: 지역 이름·지도 제공자 라벨·바로가기 링크·빈 이미지·목록으로', async () => {
    server.use(
      gqlOk('AdminStore', {
        adminStore: detail(true, { websiteUrl: 'https://lumi.test', mapProvider: 'KAKAO' }),
      }),
    );
    boot('/stores/17');
    await screen.findByRole('heading', { level: 2, name: '루미 케이크' });
    expect(await screen.findByText('서울 강남구')).toBeInTheDocument();
    expect(screen.getByText('카카오맵')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '박사장(seller20)' })).toHaveAttribute(
      'href',
      '/sellers/20',
    );
    expect(screen.getByRole('link', { name: '상품 보기' })).toHaveAttribute(
      'href',
      '/products?storeId=17',
    );
    expect(screen.getByRole('link', { name: '주문 보기' })).toHaveAttribute(
      'href',
      '/orders?storeId=17',
    );
    expect(screen.getByRole('link', { name: '리뷰 보기' })).toHaveAttribute(
      'href',
      '/reviews?storeId=17',
    );
    expect(screen.getByText('픽업 60분 전')).toBeInTheDocument();
    expect(screen.getByText('이미지 없음')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'https://lumi.test' })).toHaveAttribute(
      'target',
      '_blank',
    );
    expect(screen.getByRole('link', { name: /카카오맵에서 보기/ })).toHaveAttribute(
      'href',
      'https://map.kakao.com/link/map/%EB%A3%A8%EB%AF%B8%20%EC%BC%80%EC%9D%B4%ED%81%AC,37.5,127.0',
    );
    // 지도 키가 없으면 미리보기 대신 안내
    expect(
      screen.getByText('지도 미리보기를 쓸 수 없습니다. 지도 키가 설정되지 않았습니다.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('지도 제공자가 네이버 지도가 아니라 구매자 앱에는 지도가 나오지 않습니다.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '목록으로' })).toHaveAttribute('href', '/stores');
  });

  it('수정 저장 실패는 저장 버튼 위와 토스트로 알린다', async () => {
    server.use(
      gqlOk('AdminStore', { adminStore: detail() }),
      gqlError('AdminUpdateStoreBasicInfo', {
        message: '지역이 없습니다.',
        code: 'REGION_NOT_FOUND',
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
    );
    boot('/stores/17');
    await userEvent.click(await screen.findByRole('tab', { name: '기본 정보 수정' }));
    await userEvent.type(await screen.findByLabelText(/^매장명/), '!');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    const alert = await screen.findByText('지역이 없습니다.', { selector: 'p[role="alert"]' });
    // 오류 문단은 저장 버튼 줄 바로 앞에 있다
    expect(alert.nextElementSibling).toContainElement(screen.getByRole('button', { name: '저장' }));
    await vi.waitFor(() =>
      expect(document.querySelector('[data-sonner-toast][data-type="error"]')).toHaveTextContent(
        '지역이 없습니다.',
      ),
    );
  });

  /** 좌표 변환 응답을 테스트가 풀어 줄 때까지 붙잡는다 */
  function geocodeHeld() {
    let release = () => undefined as void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      graphql.query('AdminGeocodeAddress', async () => {
        await held;
        return HttpResponse.json({
          data: {
            adminGeocodeAddress: {
              latitude: 37.5000242,
              longitude: 127.0365717,
              sigunguCode: '11680',
              regionId: '5',
            },
          },
        });
      }),
    );
    return () => release();
  }

  it('주소 검색 뒤 좌표를 기다리는 사이 되돌리면 늦게 온 좌표를 버린다', async () => {
    installFakePostcode(postcodeResult({ roadAddress: '서울 강남구 테헤란로 152' }));
    const release = geocodeHeld();
    await openEdit();
    const address = screen.getByLabelText(/^주소/);
    const original = (address as HTMLInputElement).value;
    await searchAddress();
    await vi.waitFor(() => expect(address).toHaveValue('서울 강남구 테헤란로 152'));
    await userEvent.click(screen.getByRole('button', { name: '되돌리기' }));
    expect(address).toHaveValue(original);

    release();
    await new Promise((r) => setTimeout(r, 50));
    expect(address).toHaveValue(original);
    expect(screen.queryByText(GEOCODED)).not.toBeInTheDocument();
    expect(screen.queryByText(/37\.5000242/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '되돌리기' })).toBeDisabled();
  });

  it('좌표를 기다리는 사이 상세 주소를 이어 쓰면 좌표는 그대로 채운다', async () => {
    installFakePostcode(postcodeResult({ roadAddress: '서울 강남구 테헤란로 152' }));
    const release = geocodeHeld();
    await openEdit();
    await searchAddress();
    const address = screen.getByLabelText(/^주소/);
    await vi.waitFor(() => expect(address).toHaveValue('서울 강남구 테헤란로 152'));
    await userEvent.type(address, ' 3층');

    release();
    expect(await screen.findByText(GEOCODED)).toBeInTheDocument();
    expect(address).toHaveValue('서울 강남구 테헤란로 152 3층');
    expect(screen.getByText('위도 37.5000242 · 경도 127.0365717')).toBeInTheDocument();
  });

  it('주소 검색: 주소·시도·시군구·동을 채우고, 지역을 고르고, 좌표를 채워 저장한다', async () => {
    installFakePostcode(
      postcodeResult({
        roadAddress: '경기 성남시 분당구 판교역로 166',
        sido: '경기',
        sigungu: '성남시 분당구',
        bname: '백현동',
        sigunguCode: '41135',
      }),
    );
    const queries = geocodeReturns({
      latitude: 37.3952969,
      longitude: 127.1109815,
      sigunguCode: '41135',
      regionId: '7',
    });
    const saved = await openEdit(detail(true, { regionId: null, latitude: null, longitude: null }));
    await searchAddress();

    expect(await screen.findByText(GEOCODED)).toBeInTheDocument();
    expect(screen.getByLabelText(/^주소/)).toHaveValue('경기 성남시 분당구 판교역로 166');
    expect(screen.getByLabelText('시/도')).toHaveValue('경기');
    expect(screen.getByLabelText('시/군/구')).toHaveValue('성남시 분당구');
    expect(screen.getByLabelText('동/읍/면')).toHaveValue('백현동');
    expect(screen.getByText('위도 37.3952969 · 경도 127.1109815')).toBeInTheDocument();
    expect(queries).toEqual(['경기 성남시 분당구 판교역로 166']);
    expect(districtPicker()).toHaveTextContent('성남시 분당구');

    // 검색으로 채운 칸은 읽기 전용이고 '직접 입력'으로 푼다
    expect(screen.getByLabelText('시/도')).toHaveAttribute('readonly');
    await userEvent.click(screen.getByRole('button', { name: '직접 입력' }));
    expect(screen.getByLabelText('시/도')).not.toHaveAttribute('readonly');

    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    await vi.waitFor(() =>
      expect(saved.input).toEqual({
        storeId: '17',
        addressFull: '경기 성남시 분당구 판교역로 166',
        addressCity: '경기',
        addressDistrict: '성남시 분당구',
        addressNeighborhood: '백현동',
        regionId: '7',
        latitude: '37.3952969',
        longitude: '127.1109815',
      }),
    );
  });

  it.each([
    {
      title: '시군구 코드가 서비스 지역이면 그 지역을 고른다',
      sigunguCode: '11680',
      geocodeRegionId: null,
      regionId: '5',
      note: false,
    },
    {
      title: '서비스 지역이 아니면 지역을 비우고 직접 고르라고 안내한다',
      sigunguCode: '26110',
      geocodeRegionId: null,
      regionId: null,
      note: true,
    },
    {
      title: '숨긴 지역과 맞으면 고르지 않는다(BE가 거절한다)',
      sigunguCode: '11110',
      geocodeRegionId: null,
      regionId: null,
      note: true,
    },
    {
      title: '우편번호 결과에 코드가 없으면 BE 지오코딩이 찾은 지역으로 보완한다',
      sigunguCode: '',
      geocodeRegionId: '5',
      regionId: '5',
      note: false,
    },
  ])('지역 자동 매칭: $title', async ({ sigunguCode, geocodeRegionId, regionId, note }) => {
    installFakePostcode(postcodeResult({ sigunguCode }));
    geocodeReturns({ latitude: 37.5, longitude: 127.03, sigunguCode, regionId: geocodeRegionId });
    const saved = await openEdit(detail(true, { regionId: '7' }));
    await searchAddress();
    await screen.findByText(GEOCODED);
    expect(!!screen.queryByText('서비스 지역이 아닙니다. 지역을 직접 선택해 주세요.')).toBe(note);
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    await vi.waitFor(() => expect(saved.input).toMatchObject({ regionId }));
  });

  it.each([
    {
      title: '좌표를 못 찾으면',
      respond: () => geocodeReturns(null),
      message: '이 주소의 좌표를 찾지 못했습니다. 지도를 누르거나 좌표를 직접 입력해 주세요.',
    },
    {
      title: '지오코딩이 실패하면',
      respond: () =>
        server.use(
          gqlError('AdminGeocodeAddress', {
            message: '좌표 변환을 쓸 수 없습니다.',
            code: 'GEOCODE_UNAVAILABLE',
            classification: 'INTERNAL',
            statusCode: 503,
          }),
        ),
      message: '좌표를 자동으로 채우지 못했습니다. 지도를 누르거나 좌표를 직접 입력해 주세요.',
    },
  ])('$title 안내하고 좌표 칸을 펼친다(기존 좌표는 둔다)', async ({ respond, message }) => {
    installFakePostcode(postcodeResult());
    respond();
    await openEdit();
    expect(screen.queryByLabelText('위도')).not.toBeInTheDocument();
    await searchAddress();
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByLabelText('위도')).toHaveValue('37.5');
    expect(screen.getByLabelText('경도')).toHaveValue('127.0');
  });

  it('좌표 직접 수정: 접힌 칸을 펼쳐 고치고, 숨긴 칸에 오류가 있으면 저절로 펼친다', async () => {
    const saved = await openEdit();
    expect(screen.getByText('위도 37.5 · 경도 127.0')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '직접 수정' }));
    await userEvent.clear(screen.getByLabelText('위도'));
    await userEvent.type(screen.getByLabelText('위도'), '91');
    await userEvent.click(screen.getByRole('button', { name: '직접 수정 닫기' }));
    expect(screen.queryByLabelText('위도')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByText('위도는 -90~90 사이 숫자로 입력해 주세요.')).toBeInTheDocument();
    expect(saved.input).toBeUndefined();

    await userEvent.clear(screen.getByLabelText('위도'));
    await userEvent.type(screen.getByLabelText('위도'), '37.51');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    await vi.waitFor(() => expect(saved.input).toEqual({ storeId: '17', latitude: '37.51' }));
  });

  const NONE_WARNING =
    "좌표가 있지만 지도 제공자가 '사용 안 함'이라 구매자 앱에 위치가 나오지 않습니다.";
  const NO_COORDS_WARNING =
    '좌표가 없어 구매자 앱에서 지도와 길찾기가 동작하지 않습니다. 주소를 검색하거나 좌표를 입력해 주세요.';
  it.each([
    { from: 'NAVER', pick: '카카오맵', value: 'KAKAO', coords: true, warning: null },
    { from: 'NAVER', pick: '사용 안 함', value: 'NONE', coords: true, warning: NONE_WARNING },
    {
      from: 'NONE',
      pick: '네이버 지도',
      value: 'NAVER',
      coords: false,
      warning: NO_COORDS_WARNING,
    },
    { from: 'NAVER', pick: '사용 안 함', value: 'NONE', coords: false, warning: null },
  ])(
    '지도 제공자 $from → $pick(좌표 $coords): 경고 $warning',
    async ({ from, pick, value, coords, warning }) => {
      const over = coords
        ? { mapProvider: from }
        : { mapProvider: from, latitude: null, longitude: null };
      const saved = await openEdit(detail(true, over));
      await userEvent.click(screen.getByRole('radio', { name: new RegExp(`^${pick}`) }));
      if (warning) expect(screen.getByText(warning)).toBeInTheDocument();
      else {
        expect(screen.queryByText(NONE_WARNING)).not.toBeInTheDocument();
        expect(screen.queryByText(NO_COORDS_WARNING)).not.toBeInTheDocument();
      }
      await userEvent.click(screen.getByRole('button', { name: '저장' }));
      await vi.waitFor(() => expect(saved.input).toEqual({ storeId: '17', mapProvider: value }));
    },
  );

  it('지도 미리보기: 핀을 끌거나 지도를 누르면 좌표 칸을 소수 7자리로 채워 저장한다', async () => {
    vi.stubEnv('VITE_NAVER_MAP_CLIENT_ID', 'test-key');
    const fake = installFakeNaverMaps();
    const saved = await openEdit();
    await screen.findByRole('region', { name: '매장 위치 지도' });
    // 개요 탭의 읽기 전용 지도는 탭을 옮기면 정리되고, 수정 폼이 새 지도를 만든다
    await vi.waitFor(() => expect(fake.markers).toHaveLength(2));
    expect(fake.maps[0]!.destroy).toHaveBeenCalled();
    const marker = fake.markers[1]!;
    expect(marker.draggable).toBe(true);
    expect(marker.map).toBe(fake.maps[1]);

    fake.drag(37.512345678, 127.0987654321);
    expect(await screen.findByText('위도 37.5123457 · 경도 127.0987654')).toBeInTheDocument();

    fake.click(37.4, 127.1);
    expect(await screen.findByText('위도 37.4000000 · 경도 127.1000000')).toBeInTheDocument();
    expect(marker.getPosition().lat()).toBe(37.4);

    // 칸을 직접 고치면 핀만 옮긴다(되먹임으로 칸을 다시 쓰지 않는다)
    await userEvent.click(screen.getByRole('button', { name: '직접 수정' }));
    await userEvent.clear(screen.getByLabelText('위도'));
    await userEvent.type(screen.getByLabelText('위도'), '37.45');
    await vi.waitFor(() => expect(marker.getPosition().lat()).toBe(37.45));
    expect(screen.getByLabelText('위도')).toHaveValue('37.45');

    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    await vi.waitFor(() =>
      expect(saved.input).toEqual({ storeId: '17', latitude: '37.45', longitude: '127.1000000' }),
    );
  });

  it('지도 미리보기: 좌표가 없으면 핀 없이 안내하고, 지도를 누르면 핀을 놓는다', async () => {
    vi.stubEnv('VITE_NAVER_MAP_CLIENT_ID', 'test-key');
    const fake = installFakeNaverMaps();
    await openEdit(detail(true, { latitude: null, longitude: null }));
    expect(
      await screen.findByText('주소를 검색해 좌표를 채우거나 지도를 눌러 핀을 놓아 주세요.'),
    ).toBeInTheDocument();
    // 좌표가 없으면 개요 탭은 지도를 만들지 않는다
    expect(fake.markers).toHaveLength(1);
    expect(fake.markers[0]!.map).toBeNull();
    fake.click(37.55, 126.99);
    expect(await screen.findByText('위도 37.5500000 · 경도 126.9900000')).toBeInTheDocument();
    expect(fake.markers[0]!.map).toBe(fake.maps[0]);
  });

  it('지도 미리보기: 상세 개요는 읽기 전용(핀 고정)이다', async () => {
    vi.stubEnv('VITE_NAVER_MAP_CLIENT_ID', 'test-key');
    const fake = installFakeNaverMaps();
    server.use(gqlOk('AdminStore', { adminStore: detail() }));
    boot('/stores/17');
    await screen.findByRole('region', { name: '매장 위치 지도' });
    await vi.waitFor(() => expect(fake.markers).toHaveLength(1));
    expect(fake.markers[0]!.draggable).toBe(false);
    expect(fake.listeners.size).toBe(0);
  });

  it('지도 미리보기: 인증에 실패하면 Web 서비스 URL 확인을 안내한다', async () => {
    vi.stubEnv('VITE_NAVER_MAP_CLIENT_ID', 'test-key');
    installFakeNaverMaps();
    await openEdit();
    await screen.findByRole('region', { name: '매장 위치 지도' });
    window.navermap_authFailure!();
    expect(await screen.findByText(/지도 인증에 실패했습니다/)).toBeInTheDocument();
  });

  it('없는 매장은 NOT_FOUND', async () => {
    server.use(
      gqlError('AdminStore', {
        message: '매장 없음',
        code: 'STORE_NOT_FOUND',
        classification: 'NOT_FOUND',
        statusCode: 404,
      }),
    );
    boot('/stores/999');
    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent('매장 없음');
  });
});
