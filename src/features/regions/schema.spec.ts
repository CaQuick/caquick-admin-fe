import {
  type Region,
  regionFormSchema,
  toCreateInput,
  toFormValues,
  toUpdateInput,
} from './schema';

const region: Region = {
  id: '5',
  parentId: '1',
  level: 2,
  name: '강남구',
  slug: 'gangnam',
  sortOrder: 3,
  isActive: true,
  centerLat: '37.5',
  centerLng: null,
  storeCount: 12,
  childCount: 0,
  createdAt: 'x',
  updatedAt: 'y',
};

describe('region schema', () => {
  it.each([
    [{ slug: 'Gangnam' }, false],
    [{ slug: 'gang nam' }, false],
    [{ centerLat: '91' }, false],
    [{ centerLng: '-181' }, false],
    [{ centerLat: '', centerLng: '' }, true],
    [{ sortOrder: 1.5 }, false],
    [{ centerLat: '0x10' }, false], // Number()는 16으로 읽지만 BE Decimal은 거절한다
    [{ centerLng: '1e2' }, false],
    [{ sortOrder: 2_147_483_647 }, true], // GraphQL Int 상한
    [{ sortOrder: 2_147_483_648 }, false],
    [{ sortOrder: -2_147_483_649 }, false],
  ])('%j → %s', (patch, ok) => {
    expect(regionFormSchema.safeParse({ ...toFormValues(region), ...patch }).success).toBe(ok);
  });

  it.each([
    [{ slug: 'Gangnam' }, 'slug', '영문 소문자, 숫자, 하이픈(-)만 입력해 주세요.'],
    [{ slug: '' }, 'slug', '영문 식별자를 입력해 주세요.'],
    [{ name: '' }, 'name', '이름을 입력해 주세요.'],
    [{ centerLat: '91' }, 'centerLat', '중심 위도는 -90~90 사이 숫자로 입력해 주세요.'],
    [{ centerLng: '181' }, 'centerLng', '중심 경도는 -180~180 사이 숫자로 입력해 주세요.'],
    [{ sortOrder: 1.5 }, 'sortOrder', '정수를 입력해 주세요.'],
  ])('%j → %s: %s', (patch, path, message) => {
    const r = regionFormSchema.safeParse({ ...toFormValues(region), ...patch });
    // 폼은 칸마다 첫 오류만 보여 준다
    expect(r.error?.issues[0]).toEqual(expect.objectContaining({ path: [path], message }));
  });

  it('생성 입력: 빈 좌표는 null, 상위 지정', () => {
    expect(
      toCreateInput(
        {
          name: '서울',
          slug: 'seoul',
          sortOrder: 0,
          isActive: true,
          centerLat: '',
          centerLng: '127',
        },
        null,
      ),
    ).toEqual({
      parentId: null,
      name: '서울',
      slug: 'seoul',
      sortOrder: 0,
      isActive: true,
      centerLat: null,
      centerLng: '127',
    });
  });

  it('수정 입력: 바뀐 것만, 좌표 비움은 null', () => {
    const before = toFormValues(region);
    expect(toUpdateInput('5', before, { ...before })).toBeNull();
    expect(
      toUpdateInput('5', before, { ...before, name: '강남', centerLat: '', isActive: false }),
    ).toEqual({ regionId: '5', name: '강남', isActive: false, centerLat: null });
  });
});
