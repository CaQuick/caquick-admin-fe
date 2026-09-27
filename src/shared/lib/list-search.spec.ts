import { z } from 'zod';

import { DEFAULT_LIMIT, listSearchBase, optionalBoolText, optionalText } from './list-search';

const schema = z.object({ ...listSearchBase, id: optionalText, active: optionalBoolText });

describe('list-search', () => {
  it.each([
    [{ id: '17' }, '17'],
    [{ id: 17 }, '17'], // 주소창 입력은 숫자로 파싱된다
    [{ id: 0 }, '0'],
    [{ id: '0' }, '0'],
    [{ id: '' }, undefined],
    [{}, undefined],
    [{ id: true }, undefined],
  ])('optionalText %j → %j', (input, expected) => {
    expect(schema.parse(input).id).toBe(expected);
  });

  it.each([
    [{ active: 'false' }, 'false'],
    [{ active: false }, 'false'],
    [{ active: true }, 'true'],
    [{ active: 'yes' }, undefined],
  ])('optionalBoolText %j → %j', (input, expected) => {
    expect(schema.parse(input).active).toBe(expected);
  });

  it('limit·cursor 범위', () => {
    expect(schema.parse({ limit: '100', cursor: 'c' })).toMatchObject({ limit: 100, cursor: 'c' });
    expect(schema.parse({ limit: 101, cursor: '' })).toMatchObject({
      limit: undefined,
      cursor: undefined,
    });
    expect(DEFAULT_LIMIT).toBe(20);
  });
});
