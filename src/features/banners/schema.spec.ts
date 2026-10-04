import {
  type Banner,
  bannerFormSchema,
  defaultBannerValues,
  toCreateInput,
  toFormValues,
  toUpdateInput,
} from './schema';

const banner: Banner = {
  id: '5',
  placement: 'CATEGORY',
  title: '가을',
  imageUrl: 'https://cdn/a.png',
  linkType: 'CATEGORY',
  linkUrl: null,
  linkProductId: null,
  linkStoreId: null,
  linkCategoryId: '41',
  startsAt: '2026-09-30T15:00:00.000Z',
  endsAt: null,
  sortOrder: 2,
  isActive: true,
  createdAt: 'x',
  updatedAt: 'y',
};

describe('banner schema', () => {
  const base = { ...defaultBannerValues(), imageUrl: 'https://cdn/a.png' };
  it.each<{ name: string; patch: Partial<typeof base>; path?: string; message?: string }>([
    { name: '기본값에 이미지만 있으면 통과', patch: {} },
    {
      name: '이미지가 없으면 거절',
      patch: { imageUrl: '' },
      path: 'imageUrl',
      message: '이미지를 올려 주세요.',
    },
    {
      name: '제목 201자는 거절',
      patch: { title: 'a'.repeat(201) },
      path: 'title',
      message: '제목은 200자 이하로 입력해 주세요.',
    },
    {
      name: '대상 유형인데 고르지 않으면 거절',
      patch: { linkType: 'PRODUCT', linkValue: '' },
      path: 'linkValue',
      message: '연결할 대상을 골라 주세요.',
    },
    {
      name: '웹 주소 유형인데 비어 있으면 거절',
      patch: { linkType: 'URL', linkValue: '' },
      path: 'linkValue',
      message: '웹 주소를 입력해 주세요.',
    },
    {
      name: '웹 주소가 http(s)로 시작하지 않으면 거절',
      patch: { linkType: 'URL', linkValue: 'caquick.site' },
      path: 'linkValue',
      message: 'http:// 또는 https://로 시작하는 주소를 입력해 주세요.',
    },
    {
      name: '카테고리 배치에 카테고리 링크가 없으면 거절',
      patch: { placement: 'CATEGORY', linkType: 'NONE' },
      path: 'linkType',
      message: '카테고리 배치는 이벤트 카테고리로 연결해야 합니다.',
    },
    {
      name: '카테고리 배치에 카테고리 링크면 통과',
      patch: { placement: 'CATEGORY', linkType: 'CATEGORY', linkValue: '41' },
    },
    {
      name: '종료가 시작과 같으면 거절',
      patch: { startsAt: '2026-10-01T00:00', endsAt: '2026-10-01T00:00' },
      path: 'endsAt',
      message: '종료 시각은 시작 시각보다 뒤로 정해 주세요.',
    },
    {
      name: '정렬 순서가 숫자가 아니면 거절',
      patch: { sortOrder: Number.NaN },
      path: 'sortOrder',
      message: '정렬 순서를 숫자로 입력해 주세요.',
    },
    {
      name: '정렬 순서 소수는 거절',
      patch: { sortOrder: 1.5 },
      path: 'sortOrder',
      message: '정렬 순서는 소수점 없이 입력해 주세요.',
    },
    { name: '정렬 순서 32비트 상한은 통과', patch: { sortOrder: 2147483647 } },
    {
      name: '정렬 순서 32비트 상한 + 1은 거절',
      patch: { sortOrder: 2147483648 },
      path: 'sortOrder',
      message: '정렬 순서는 2,147,483,647 이하로 입력해 주세요.',
    },
    { name: '정렬 순서 32비트 하한은 통과', patch: { sortOrder: -2147483648 } },
    {
      name: '정렬 순서 32비트 하한 - 1은 거절',
      patch: { sortOrder: -2147483649 },
      path: 'sortOrder',
      message: '정렬 순서는 -2,147,483,648 이상으로 입력해 주세요.',
    },
  ])('검증: $name', ({ patch, path, message }) => {
    const r = bannerFormSchema.safeParse({ ...base, ...patch });
    if (!path) {
      expect(r.success).toBe(true);
      return;
    }
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => [i.path.join('.'), i.message])).toContainEqual([
      path,
      message,
    ]);
  });

  it('생성 입력은 유형에 맞는 링크 필드만 담는다', () => {
    const v = {
      ...defaultBannerValues('SEARCH'),
      imageUrl: 'u',
      linkType: 'STORE' as const,
      linkValue: '17',
      startsAt: '2026-10-01T00:00',
    };
    expect(toCreateInput(v)).toEqual({
      placement: 'SEARCH',
      title: null,
      imageUrl: 'u',
      linkType: 'STORE',
      linkStoreId: '17',
      startsAt: '2026-09-30T15:00:00.000Z',
      endsAt: null,
      sortOrder: 0,
      isActive: true,
    });
  });

  it('수정 입력은 바뀐 것만, 링크 유형 변경은 새 값과 함께', () => {
    const before = toFormValues(banner);
    expect(before).toMatchObject({
      placement: 'CATEGORY',
      linkType: 'CATEGORY',
      linkValue: '41',
      startsAt: '2026-10-01T00:00',
      endsAt: '',
    });
    expect(toUpdateInput('5', before, { ...before })).toBeNull();
    expect(
      toUpdateInput('5', before, {
        ...before,
        title: '',
        linkType: 'URL',
        linkValue: 'https://x',
        endsAt: '2026-10-05T00:00',
        isActive: false,
      }),
    ).toEqual({
      bannerId: '5',
      title: null,
      linkType: 'URL',
      linkUrl: 'https://x',
      endsAt: '2026-10-04T15:00:00.000Z',
      isActive: false,
    });
  });

  it('소비자가 없는 배치는 폼에서 HOME_MAIN으로 표시', () => {
    expect(
      toFormValues({ ...banner, placement: 'STORE', linkType: 'NONE', linkCategoryId: null })
        .placement,
    ).toBe('HOME_MAIN');
  });
});
