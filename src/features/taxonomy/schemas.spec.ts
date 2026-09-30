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

  const withSort = (sortOrder: number) =>
    categoryFormSchema.safeParse({ name: 'a', description: '', sortOrder, isActive: true });
  const RANGE = '정렬 순서는 -2,147,483,648부터 2,147,483,647 사이로 입력해 주세요.';
  it.each([
    [-2147483648, undefined],
    [2147483647, undefined],
    [0, undefined],
    [-2147483649, RANGE],
    [2147483648, RANGE],
    [1e12, RANGE],
    [1.5, '정렬 순서는 정수로 입력해 주세요.'],
    [NaN, '정렬 순서를 숫자로 입력해 주세요.'],
  ])('카테고리 정렬 순서 %d → %s', (sortOrder, message) => {
    const r = withSort(sortOrder);
    expect(r.error?.issues[0]?.message).toBe(message);
  });

  it('폼 오류 문구는 존댓말 문장이다', () => {
    const issues = (v: unknown) =>
      categoryFormSchema.safeParse(v).error?.issues.map((i) => i.message);
    expect(
      issues({ name: ' ', description: 'x'.repeat(256), sortOrder: 0, isActive: true }),
    ).toEqual(['이름을 입력해 주세요.', '설명은 255자 이하로 입력해 주세요.']);
    expect(
      issues({ name: 'x'.repeat(101), description: '', sortOrder: 0, isActive: true }),
    ).toEqual(['이름은 100자 이하로 입력해 주세요.']);
    expect(tagFormSchema.safeParse({ name: 'x'.repeat(81) }).error?.issues[0]?.message).toBe(
      '이름은 80자 이하로 입력해 주세요.',
    );
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
