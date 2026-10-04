import { NAV_GROUPS, titleFor } from './nav';

describe('nav', () => {
  it('경로에 맞는 메뉴 제목을 돌려주고 모르면 빈 문자열', () => {
    expect(titleFor('/')).toBe('대시보드');
    expect(titleFor('/nowhere')).toBe('');
  });

  it.each([
    { path: '/notifications', want: '알림' },
    { path: '/notifications/send', want: '알림' },
    { path: '/banners/5', want: '배너' },
    { path: '/search-chips', want: '검색 칩' },
  ])('하위 화면도 메뉴 제목을 따른다: $path → $want', ({ path, want }) => {
    expect(titleFor(path)).toBe(want);
  });

  it('모든 메뉴 항목은 라벨·아이콘이 있다', () => {
    for (const g of NAV_GROUPS) for (const i of g.items) expect(i.label && i.icon).toBeTruthy();
  });
});
