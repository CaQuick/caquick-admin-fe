import { currentBannerIds } from './live-status';

const NOW = new Date('2026-10-01T00:00:00.000Z');
const BEFORE = '2026-09-30T23:59:59.999Z';
const AFTER = '2026-10-01T00:00:00.001Z';

describe('배너 현재 노출', () => {
  const live = { isActive: true, startsAt: null, endsAt: null, linkCategoryId: null };
  it.each([
    {
      name: '슬롯마다 정렬 순서가 가장 작은 것',
      banners: [
        { ...live, id: '1', placement: 'HOME_MAIN', sortOrder: 5 },
        { ...live, id: '2', placement: 'HOME_MAIN', sortOrder: -1 },
        { ...live, id: '3', placement: 'SEARCH', sortOrder: 9 },
      ],
      want: ['2', '3'],
    },
    {
      name: '정렬 순서가 같으면 ID가 작은 것(자릿수가 다른 ID도 숫자로 비교)',
      banners: [
        { ...live, id: '10', placement: 'HOME_MAIN', sortOrder: 0 },
        { ...live, id: '9', placement: 'HOME_MAIN', sortOrder: 0 },
      ],
      want: ['9'],
    },
    {
      name: '숨김·예약·종료는 건너뛴다',
      banners: [
        { ...live, id: '1', placement: 'HOME_MAIN', sortOrder: 0, isActive: false },
        { ...live, id: '2', placement: 'HOME_MAIN', sortOrder: 0, startsAt: AFTER },
        { ...live, id: '3', placement: 'HOME_MAIN', sortOrder: 0, endsAt: BEFORE },
        { ...live, id: '4', placement: 'HOME_MAIN', sortOrder: 7 },
      ],
      want: ['4'],
    },
    {
      name: '카테고리 배치는 카테고리마다 따로 고른다',
      banners: [
        { ...live, id: '1', placement: 'CATEGORY', sortOrder: 1, linkCategoryId: '41' },
        { ...live, id: '2', placement: 'CATEGORY', sortOrder: 0, linkCategoryId: '41' },
        { ...live, id: '3', placement: 'CATEGORY', sortOrder: 5, linkCategoryId: '42' },
        { ...live, id: '4', placement: 'CATEGORY', sortOrder: 0, linkCategoryId: null },
      ],
      want: ['2', '3'],
    },
    {
      name: '구매자 앱에 자리가 없는 배치는 표시하지 않는다',
      banners: [
        { ...live, id: '1', placement: 'HOME_SUB', sortOrder: 0 },
        { ...live, id: '2', placement: 'STORE', sortOrder: 0 },
      ],
      want: [],
    },
  ] as const)('현재 노출: $name', ({ banners, want }) => {
    expect([...currentBannerIds(banners, NOW)].sort()).toEqual([...want].sort());
  });
});
