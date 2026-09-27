import { hasUserFilters, toUserListInput, usersSearchSchema } from './search';

describe('users search', () => {
  it('기본값과 필터 변환', () => {
    const empty = usersSearchSchema.parse({});
    expect(toUserListInput(empty)).toEqual({
      limit: 20,
      cursor: null,
      keyword: null,
      status: null,
    });
    expect(hasUserFilters(empty)).toBe(false);
    const s = usersSearchSchema.parse({ q: 'seo', status: 'SUSPENDED', limit: '5', cursor: 'c' });
    expect(toUserListInput(s)).toEqual({
      limit: 5,
      cursor: 'c',
      keyword: 'seo',
      status: 'SUSPENDED',
    });
    expect(hasUserFilters(s)).toBe(true);
    expect(usersSearchSchema.parse({ status: 'X' }).status).toBeUndefined();
  });
});
