import { type StoreDetail, diffToInput, storeEditSchema, toEditValues } from './edit-schema';

const store: StoreDetail = {
  id: '17',
  sellerAccountId: '20',
  sellerLabel: '박사장(seller20)',
  storeName: '루미',
  storePhone: '02-1',
  addressFull: '서울',
  addressCity: null,
  addressDistrict: '강남구',
  addressNeighborhood: null,
  regionId: '5',
  latitude: '37.5',
  longitude: '127.0',
  mapProvider: 'NAVER',
  websiteUrl: null,
  businessHoursText: '10-20',
  profileImageUrl: null,
  greetingMessage: null,
  pickupSlotIntervalMinutes: 30,
  minLeadTimeMinutes: 60,
  maxDaysAhead: 14,
  isActive: true,
  createdAt: 'x',
  updatedAt: 'y',
};

describe('store edit', () => {
  it('바뀐 필드만 보내고 빈 문자열은 null(지움)', () => {
    const before = toEditValues(store);
    const after = {
      ...before,
      storeName: '루미 케이크',
      addressDistrict: '',
      regionId: '',
      websiteUrl: 'https://lumi.test',
      profileImageUrl: 'https://img/p.png',
    };
    expect(diffToInput('17', before, after)).toEqual({
      storeId: '17',
      storeName: '루미 케이크',
      addressDistrict: null,
      regionId: null,
      websiteUrl: 'https://lumi.test',
      profileImageUrl: 'https://img/p.png',
    });
  });

  it('아무것도 안 바뀌면 null', () => {
    const v = toEditValues(store);
    expect(diffToInput('17', v, { ...v })).toBeNull();
  });

  it.each([
    [{ storeName: ' ' }, 'storeName', '매장명은 필수입니다.'],
    [{ storePhone: '' }, 'storePhone', '매장 전화는 필수입니다.'],
    [{ latitude: 'abc' }, 'latitude', '위도는 -90~90 사이 숫자로 입력해 주세요.'],
    [{ longitude: '181' }, 'longitude', '경도는 -180~180 사이 숫자로 입력해 주세요.'],
    [{ latitude: '' }, 'latitude', '위도와 경도를 함께 입력해 주세요.'],
    [
      { websiteUrl: 'lumi.test' },
      'websiteUrl',
      'http:// 또는 https://로 시작하는 주소를 입력해 주세요.',
    ],
    // BE store-field-limits(코드 포인트)
    [{ storePhone: '1'.repeat(31) }, 'storePhone', '30자 이하로 입력해 주세요.'],
    [{ addressCity: '가'.repeat(51) }, 'addressCity', '50자 이하로 입력해 주세요.'],
    [{ addressDistrict: '가'.repeat(81) }, 'addressDistrict', '80자 이하로 입력해 주세요.'],
    [{ addressNeighborhood: '가'.repeat(81) }, 'addressNeighborhood', '80자 이하로 입력해 주세요.'],
    [{ businessHoursText: '가'.repeat(501) }, 'businessHoursText', '500자 이하로 입력해 주세요.'],
  ])('%j 는 %s 칸에서 거절', (patch, path, message) => {
    const r = storeEditSchema.safeParse({ ...toEditValues(store), ...patch });
    expect(r.error?.issues).toEqual([expect.objectContaining({ path: [path], message })]);
  });

  it.each([
    { storePhone: '1'.repeat(30) },
    { addressCity: '🎂'.repeat(50) },
    { websiteUrl: '', latitude: '', longitude: '' },
    { latitude: '-90', longitude: '180' },
  ])('%j 는 통과', (patch) => {
    expect(storeEditSchema.safeParse({ ...toEditValues(store), ...patch }).success).toBe(true);
  });
});
