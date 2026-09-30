import { z } from 'zod';

import { listSearchBase, optionalBoolText, optionalIdText, keywordText } from './list-search';
import { parseSearch, stringifySearch } from './search-params';

describe('search-params', () => {
  it.each([
    [{ deleted: 'true' }, '?deleted=true'],
    [{ active: 'false' }, '?active=false'],
    [{ storeId: '17' }, '?storeId=17'],
    [{ storeId: '0' }, '?storeId=0'],
    [{ cursor: '2' }, '?cursor=2'],
    [{ q: 'null' }, '?q=null'],
    [{ q: '[1]' }, '?q=%5B1%5D'],
    [{ q: '김' }, '?q=%EA%B9%80'],
    [{ q: 'a b&c' }, '?q=a+b%26c'],
    [{ limit: 50 }, '?limit=50'],
    [{ flag: true }, '?flag=true'],
    [{ q: undefined, storeId: '1' }, '?storeId=1'],
    [{}, ''],
  ])('%j → %s (따옴표로 감싸지 않는다)', (search, expected) => {
    expect(stringifySearch(search)).toBe(expected);
  });

  it.each([
    ['?deleted=true', { deleted: 'true' }],
    ['deleted=true', { deleted: 'true' }],
    ['?storeId=17&cursor=2', { storeId: '17', cursor: '2' }],
    // 기본 JSON 직렬화로 만든 옛 주소도 같은 값으로 읽는다
    ['?deleted=%22true%22&storeId=%2217%22', { deleted: 'true', storeId: '17' }],
    ['?q=%22%EA%B9%80%22', { q: '김' }],
    ['?q=%22broken', { q: '"broken' }],
    ['?q=%221%22x%22', { q: '"1"x"' }],
    ['?a=1&a=2', { a: '1' }],
    // 2^53을 넘는 ID도 숫자로 바꾸지 않는다(JSON 파싱이면 자릿수를 잃는다)
    ['?storeId=9007199254740993', { storeId: '9007199254740993' }],
    ['?regionId=18446744073709551615', { regionId: '18446744073709551615' }],
    ['', {}],
  ])('%s → %j', (searchStr, expected) => {
    expect(parseSearch(searchStr)).toEqual(expected);
  });

  it.each([
    'true',
    '17',
    '0',
    'null',
    '"quoted"',
    '""',
    '"',
    'a"b',
    '{"x":1}',
    ' 공백 ',
    '1e3',
    '007',
  ])('문자열 %j 는 왕복해도 그대로다', (value) => {
    expect(parseSearch(stringifySearch({ v: value }))).toEqual({ v: value });
  });

  it('파싱한 값은 기존 목록 스키마(ID·불리언·검색어·커서·limit)로 그대로 읽힌다', () => {
    const schema = z.object({
      ...listSearchBase,
      storeId: optionalIdText,
      deleted: optionalBoolText,
      q: keywordText,
    });
    const url = stringifySearch({
      storeId: '0',
      deleted: 'false',
      q: '17',
      cursor: '2',
      limit: 50,
    });
    expect(schema.parse(parseSearch(url))).toEqual({
      storeId: '0',
      deleted: 'false',
      q: '17',
      cursor: '2',
      limit: 50,
    });
  });
});
