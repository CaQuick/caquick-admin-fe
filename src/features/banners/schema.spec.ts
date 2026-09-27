import {
  type Banner,
  bannerFormSchema,
  defaultBannerValues,
  isoToLocal,
  localToIso,
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
  it('KST datetime-local ↔ UTC ISO', () => {
    expect(localToIso('2026-10-01T00:00')).toBe('2026-09-30T15:00:00.000Z');
    expect(localToIso('')).toBeNull();
    expect(isoToLocal('2026-09-30T15:00:00.000Z')).toBe('2026-10-01T00:00');
    expect(isoToLocal(null)).toBe('');
  });

  it('검증: 링크 대상·URL 형식·카테고리 배치·기간 순서·이미지', () => {
    const base = { ...defaultBannerValues(), imageUrl: 'https://cdn/a.png' };
    expect(bannerFormSchema.safeParse(base).success).toBe(true);
    expect(bannerFormSchema.safeParse({ ...base, imageUrl: '' }).success).toBe(false);
    expect(
      bannerFormSchema.safeParse({ ...base, linkType: 'PRODUCT', linkValue: '' }).success,
    ).toBe(false);
    expect(
      bannerFormSchema.safeParse({ ...base, linkType: 'URL', linkValue: 'caquick.site' }).success,
    ).toBe(false);
    expect(
      bannerFormSchema.safeParse({ ...base, placement: 'CATEGORY', linkType: 'NONE' }).success,
    ).toBe(false);
    expect(
      bannerFormSchema.safeParse({
        ...base,
        startsAt: '2026-10-02T00:00',
        endsAt: '2026-10-01T00:00',
      }).success,
    ).toBe(false);
    expect(
      bannerFormSchema.safeParse({
        ...base,
        placement: 'CATEGORY',
        linkType: 'CATEGORY',
        linkValue: '41',
      }).success,
    ).toBe(true);
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
