import { accountLabel } from './account-label';

describe('accountLabel', () => {
  it.each([
    ['이찬우', 'chanwoo7', '이찬우(chanwoo7)'],
    [' 이찬우 ', ' chanwoo7 ', '이찬우(chanwoo7)'], // 앞뒤 공백은 뺀다
    ['이찬우', null, '이찬우'],
    [null, 'chanwoo7', 'chanwoo7'],
    ['', 'chanwoo7', 'chanwoo7'], // 빈 이름은 없는 것
    ['  ', 'chanwoo7', 'chanwoo7'],
    ['이찬우', '', '이찬우'],
    [null, null, '#0'], // 둘 다 없으면 #계정ID — '0'도 그대로
    [undefined, undefined, '#0'],
  ])('이름 %j, 아이디 %j → %s', (name, username, label) => {
    expect(accountLabel({ accountId: '0', name, username })).toBe(label);
  });
});
