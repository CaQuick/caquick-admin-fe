import { NAV_GROUPS, titleFor } from './nav';

describe('nav', () => {
  it('경로에 맞는 메뉴 제목을 돌려주고 모르면 빈 문자열', () => {
    expect(titleFor('/')).toBe('대시보드');
    expect(titleFor('/nowhere')).toBe('');
  });

  it('모든 메뉴 항목은 라벨·아이콘이 있다', () => {
    for (const g of NAV_GROUPS) for (const i of g.items) expect(i.label && i.icon).toBeTruthy();
  });
});
