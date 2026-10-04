import { liveStatus, nextLiveBoundary } from './live-status';

const NOW = new Date('2026-10-01T00:00:00.000Z');
const BEFORE = '2026-09-30T23:59:59.999Z';
const AFTER = '2026-10-01T00:00:00.001Z';
const AT = NOW.toISOString();

describe('노출 상태', () => {
  it.each([
    { isActive: false, startsAt: null, endsAt: null, want: 'HIDDEN' },
    { isActive: false, startsAt: AFTER, endsAt: null, want: 'HIDDEN' },
    { isActive: true, startsAt: null, endsAt: null, want: 'LIVE' },
    { isActive: true, startsAt: AFTER, endsAt: null, want: 'SCHEDULED' },
    // 시작 시각은 포함, 종료 시각은 제외(구매자 조회와 같은 경계)
    { isActive: true, startsAt: AT, endsAt: null, want: 'LIVE' },
    { isActive: true, startsAt: BEFORE, endsAt: AFTER, want: 'LIVE' },
    { isActive: true, startsAt: null, endsAt: AT, want: 'ENDED' },
    { isActive: true, startsAt: null, endsAt: BEFORE, want: 'ENDED' },
    { isActive: true, startsAt: AFTER, endsAt: BEFORE, want: 'SCHEDULED' },
  ] as const)('노출 $isActive, $startsAt ~ $endsAt → $want', ({ want, ...b }) => {
    expect(liveStatus(b, NOW)).toBe(want);
  });

  const LATER = '2026-10-01T01:00:00.000Z';
  it.each([
    { name: '시각이 없으면 없다', banners: [{ isActive: true }], want: null },
    { name: '빈 목록은 없다', banners: [], want: null },
    {
      name: '예약은 시작 시각',
      banners: [{ isActive: true, startsAt: AFTER, endsAt: LATER }],
      want: AFTER,
    },
    {
      name: '노출 중은 종료 시각',
      banners: [{ isActive: true, startsAt: BEFORE, endsAt: LATER }],
      want: LATER,
    },
    {
      name: '지금과 같은 시각은 이미 지난 경계',
      banners: [{ isActive: true, startsAt: AT, endsAt: null }],
      want: null,
    },
    {
      name: '여러 배너 가운데 가장 이른 것',
      banners: [
        { isActive: true, startsAt: LATER, endsAt: null },
        { isActive: true, startsAt: null, endsAt: AFTER },
      ],
      want: AFTER,
    },
    {
      name: '숨김은 시각이 있어도 바뀌지 않는다',
      banners: [
        { isActive: false, startsAt: AFTER, endsAt: null },
        { isActive: true, startsAt: LATER, endsAt: null },
      ],
      want: LATER,
    },
  ])('다음 경계: $name', ({ banners, want }) => {
    expect(nextLiveBoundary(banners, NOW)).toBe(want === null ? null : new Date(want).getTime());
  });
});
