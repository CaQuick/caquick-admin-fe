import {
  createSellerSchema,
  resetPasswordSchema,
  toCreateSellerInput,
} from './create-seller-schema';

const base = {
  username: 'lumi.cake',
  password: 'Passw0rd!',
  businessName: '루미 케이크',
  businessPhone: '02-555-0117',
  storeName: '루미 케이크 강남점',
  storePhone: '02-555-0118',
  addressFull: '서울 강남구 테헤란로 1',
  mapProvider: 'NONE' as const,
};

describe('createSellerSchema', () => {
  it('필수만으로 통과하고 빈 선택 값은 null로 보낸다', () => {
    const parsed = createSellerSchema.parse({
      ...base,
      email: '',
      websiteUrl: '',
      regionId: '',
      latitude: '',
    });
    expect(toCreateSellerInput(parsed)).toEqual({
      username: 'lumi.cake',
      password: 'Passw0rd!',
      email: null,
      name: null,
      businessName: '루미 케이크',
      businessPhone: '02-555-0117',
      websiteUrl: null,
      store: {
        storeName: '루미 케이크 강남점',
        storePhone: '02-555-0118',
        addressFull: '서울 강남구 테헤란로 1',
        addressCity: null,
        addressDistrict: null,
        addressNeighborhood: null,
        regionId: null,
        latitude: null,
        longitude: null,
        mapProvider: 'NONE',
      },
    });
  });

  it.each([
    ['username', 'Lumi'], // 대문자
    ['username', 'ab'], // 짧음
    ['password', 'weakweak'],
    ['email', 'not-mail'],
    ['websiteUrl', 'not a url'],
    ['latitude', 'abc'],
    ['storeName', ''],
  ])('%s=%s 는 거절', (key, value) => {
    expect(createSellerSchema.safeParse({ ...base, [key]: value }).success).toBe(false);
  });

  it('resetPasswordSchema는 확인 불일치를 거절', () => {
    expect(
      resetPasswordSchema.safeParse({ newPassword: 'Passw0rd!', confirmPassword: 'Passw0rd!' })
        .success,
    ).toBe(true);
    expect(
      resetPasswordSchema.safeParse({ newPassword: 'Passw0rd!', confirmPassword: 'other' }).success,
    ).toBe(false);
  });
});
