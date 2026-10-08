import { createSellerSchema, toCreateSellerInput } from './create-seller-schema';

const base = {
  username: 'lumi.cake',
  password: 'Passw0rd!',
  businessName: '루미 케이크',
  businessPhone: '02-555-0117',
  storeName: '루미 케이크 강남점',
  storePhone: '02-555-0118',
  addressFull: '서울 강남구 테헤란로 1',
  addressCity: '',
  addressDistrict: '',
  addressNeighborhood: '',
  regionId: '',
  latitude: '',
  longitude: '',
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
    ['username', 'lumi@shop'], // 허용 외 문자
    ['username', 'ab'], // 짧음
    ['password', '1234567'], // 7자
    ['password', 'a'.repeat(65)],
    ['email', 'not-mail'],
    ['websiteUrl', 'not a url'],
    ['latitude', 'abc'],
    ['latitude', '91'], // 범위 밖(BE도 거절)
    ['storeName', ''],
  ])('%s=%s 는 거절', (key, value) => {
    expect(createSellerSchema.safeParse({ ...base, [key]: value }).success).toBe(false);
  });

  it('아이디에 영문 대문자를 받고 입력 그대로 보낸다', () => {
    const parsed = createSellerSchema.parse({ ...base, username: 'Lumi.Cake' });
    expect(toCreateSellerInput(parsed).username).toBe('Lumi.Cake');
  });

  // BE 상한: auth-admin.constants(name·email), store-field-limits(나머지)
  it.each([
    ['name', 100],
    ['businessName', 200],
    ['businessPhone', 30],
    ['storeName', 200],
    ['storePhone', 30],
    ['addressFull', 500],
    ['addressCity', 50],
    ['addressDistrict', 80],
    ['addressNeighborhood', 80],
  ])('%s 는 %i자까지 받고 한 자 더는 그 필드에서 거절', (key, max) => {
    expect(createSellerSchema.safeParse({ ...base, [key]: '가'.repeat(max) }).success).toBe(true);
    const over = createSellerSchema.safeParse({ ...base, [key]: '가'.repeat(max + 1) });
    expect(over.error?.issues).toEqual([
      expect.objectContaining({ path: [key], message: `${max}자 이하로 입력해 주세요.` }),
    ]);
  });

  it('길이는 trim 뒤 코드 포인트로 센다', () => {
    expect(
      createSellerSchema.safeParse({ ...base, storePhone: ` ${'1'.repeat(30)} ` }).success,
    ).toBe(true);
    // 이모지는 UTF-16 2칸이지만 BE처럼 1자로 센다
    expect(createSellerSchema.safeParse({ ...base, addressCity: '🎂'.repeat(50) }).success).toBe(
      true,
    );
    expect(createSellerSchema.safeParse({ ...base, addressCity: '🎂'.repeat(51) }).success).toBe(
      false,
    );
  });

  it('websiteUrl은 2048자까지 받고 한 자 더는 거절', () => {
    const url = (n: number) => `https://a.com/${'p'.repeat(n - 'https://a.com/'.length)}`;
    expect(createSellerSchema.safeParse({ ...base, websiteUrl: url(2048) }).success).toBe(true);
    const over = createSellerSchema.safeParse({ ...base, websiteUrl: url(2049) });
    expect(over.error?.issues).toEqual([
      expect.objectContaining({ path: ['websiteUrl'], message: '2048자 이하로 입력해 주세요.' }),
    ]);
  });

  it('email은 320자를 넘으면 거절', () => {
    const email = `${'a'.repeat(64)}@${'b'.repeat(252)}.com`;
    expect(email.length).toBe(321);
    const r = createSellerSchema.safeParse({ ...base, email });
    expect(r.error?.issues).toContainEqual(
      expect.objectContaining({ path: ['email'], message: '320자 이하로 입력해 주세요.' }),
    );
  });

  it.each([
    ['12345678', true],
    ['testadmin', true],
    ['1234567', false],
    ['a'.repeat(65), false],
  ])('초기 비밀번호 %s → %s (조합 규칙 없이 8~64자)', (pw, ok) => {
    expect(createSellerSchema.safeParse({ ...base, password: pw }).success).toBe(ok);
  });
});
