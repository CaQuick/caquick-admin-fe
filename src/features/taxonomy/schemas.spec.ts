import {
  categoriesSearchSchema,
  categoryFormSchema,
  tagFormSchema,
  tagsSearchSchema,
} from './schemas';

describe('taxonomy schemas', () => {
  it('카테고리 폼: 이름 필수, 설명 255, 정렬 정수', () => {
    expect(
      categoryFormSchema.safeParse({ name: ' ', description: '', sortOrder: 0, isActive: true })
        .success,
    ).toBe(false);
    expect(
      categoryFormSchema.safeParse({
        name: 'a',
        description: 'x'.repeat(256),
        sortOrder: 0,
        isActive: true,
      }).success,
    ).toBe(false);
    expect(
      categoryFormSchema.safeParse({ name: 'a', description: '', sortOrder: 1.5, isActive: true })
        .success,
    ).toBe(false);
    expect(
      categoryFormSchema.safeParse({ name: 'a', description: '', sortOrder: NaN, isActive: true })
        .success,
    ).toBe(false);
    expect(
      categoryFormSchema.safeParse({
        name: ' 가을 ',
        description: '',
        sortOrder: 3,
        isActive: false,
      }).data,
    ).toEqual({ name: '가을', description: '', sortOrder: 3, isActive: false });
  });

  it('태그 폼: 1~80자', () => {
    expect(tagFormSchema.safeParse({ name: '' }).success).toBe(false);
    expect(tagFormSchema.safeParse({ name: 'x'.repeat(81) }).success).toBe(false);
    expect(tagFormSchema.safeParse({ name: '비건' }).success).toBe(true);
  });

  it('검색 파라미터', () => {
    expect(categoriesSearchSchema.parse({ type: 'STYLE', inactive: true })).toEqual({
      type: 'STYLE',
      inactive: 'true',
    });
    expect(categoriesSearchSchema.parse({ type: 'NOPE' }).type).toBeUndefined();
    expect(tagsSearchSchema.parse({ q: '케', cursor: 'c' })).toMatchObject({
      q: '케',
      cursor: 'c',
    });
  });
});
