import { type StoreDetail, diffToInput, storeEditSchema, toEditValues } from './edit-schema';

const store: StoreDetail = {
  id: '17',
  sellerAccountId: '20',
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

  it('필수·형식 검증', () => {
    const v = toEditValues(store);
    expect(storeEditSchema.safeParse({ ...v, storeName: ' ' }).success).toBe(false);
    expect(storeEditSchema.safeParse({ ...v, latitude: 'abc' }).success).toBe(false);
    expect(storeEditSchema.safeParse({ ...v, websiteUrl: 'lumi.test' }).success).toBe(false);
    expect(storeEditSchema.safeParse({ ...v, websiteUrl: '', latitude: '' }).success).toBe(true);
  });
});
