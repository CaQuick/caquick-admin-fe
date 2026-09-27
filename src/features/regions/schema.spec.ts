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
  ])('%j → %s', (patch, ok) => {
    expect(regionFormSchema.safeParse({ ...toFormValues(region), ...patch }).success).toBe(ok);
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
