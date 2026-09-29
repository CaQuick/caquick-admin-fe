import { z } from 'zod';

import {
  DEFAULT_LIMIT,
  MAX_KEYWORD_LENGTH,
  keywordText,
  listSearchBase,
  optionalBoolText,
  optionalIdText,
  optionalText,
} from './list-search';

const schema = z.object({
  ...listSearchBase,
  id: optionalText,
  active: optionalBoolText,
  q: keywordText,
  storeId: optionalIdText,
});

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

  it.each([
    ['a'.repeat(101), 'a'.repeat(MAX_KEYWORD_LENGTH)],
    ['a'.repeat(100), 'a'.repeat(100)],
    [`  ${'가'.repeat(100)}  `, '가'.repeat(100)], // 공백은 상한 전에 떼어 낸다
    ['  케이크 ', '케이크'],
    [`${'a'.repeat(99)}🎂🎂`, `${'a'.repeat(99)}🎂`], // 이모지를 반쪽으로 자르지 않는다
    [123, '123'], // 주소창 숫자 파싱
    ['   ', undefined],
    ['', undefined],
    [undefined, undefined],
  ])('keywordText %j → %j', (q, expected) => {
    expect(schema.parse({ q }).q).toBe(expected);
  });

  it.each([
    ['17', '17'],
    [17, '17'], // ?storeId=17은 숫자로 파싱된다
    [0, '0'],
    ['0', '0'],
    ['18446744073709551615', '18446744073709551615'], // UNSIGNED BIGINT 최대
    ['18446744073709551616', undefined],
    [1e21, undefined], // String(1e21) = '1e+21'
    ['abc', undefined],
    ['17a', undefined],
    ['-1', undefined],
    [-1, undefined],
    ['1.5', undefined],
    [1.5, undefined],
    [' 17', undefined],
    ['', undefined],
    [undefined, undefined],
  ])('optionalIdText %j → %j', (storeId, expected) => {
    expect(schema.parse({ storeId }).storeId).toBe(expected);
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
