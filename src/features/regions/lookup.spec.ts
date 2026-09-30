import {
  areasOf,
  blockingCount,
  districtsOf,
  matchRegionBySigunguCode,
  regionLabel,
} from './lookup';
import { type Region } from './schema';

const region = (over: Partial<Region> & Pick<Region, 'id'>): Region => ({
  parentId: null,
  level: 1,
  name: '',
  slug: '',
  sortOrder: 0,
  isActive: true,
  centerLat: null,
  centerLng: null,
  storeCount: 0,
  childCount: 0,
  createdAt: 'x',
  updatedAt: 'y',
  ...over,
});

const seoul = region({ id: '1', name: '서울', slug: 'seoul', childCount: 2 });
const gyeonggi = region({ id: '2', name: '경기', slug: 'gyeonggi', isActive: false });
const gangnam = region({
  id: '5',
  parentId: '1',
  level: 2,
  name: '강남구',
  slug: 'sgg-11680',
  storeCount: 3,
});
const jongno = region({
  id: '6',
  parentId: '1',
  level: 2,
  name: '종로구',
  slug: 'sgg-11110',
  isActive: false,
});
const bundang = region({
  id: '7',
  parentId: '2',
  level: 2,
  name: '성남시 분당구',
  slug: 'sgg-41135',
});
const all = [seoul, gyeonggi, gangnam, jongno, bundang];

describe('regionLabel', () => {
  it.each([
    ['5', '서울 강남구'],
    ['7', '경기 성남시 분당구'],
    ['1', '서울'],
    ['99', undefined],
  ])('%s → %s', (id, label) => {
    expect(regionLabel(all, id)).toBe(label);
  });
});

describe('matchRegionBySigunguCode', () => {
  it.each([
    ['11680', '5'], // 활성 시군구
    ['41135', '7'], // 권역이 숨김이어도 시군구가 활성이면 고른다(BE도 시군구만 본다)
    ['11110', undefined], // 숨긴 시군구는 매장에 연결할 수 없다
    ['26110', undefined], // 서비스 지역 아님
    ['', undefined], // 우편번호 결과에 코드가 없음
    ['1168', undefined],
    ['11680 ', undefined],
  ])('시군구 코드 %j → 지역 %s', (code, id) => {
    expect(matchRegionBySigunguCode(all, code)?.id).toBe(id);
  });

  it('권역 slug가 같은 형식이어도 시군구만 고른다', () => {
    const odd = region({ id: '9', slug: 'sgg-11680' });
    expect(matchRegionBySigunguCode([odd], '11680')).toBeUndefined();
  });
});

describe('areasOf · districtsOf', () => {
  it('권역만 모은다', () => {
    expect(areasOf(all).map((r) => r.id)).toEqual(['1', '2']);
  });

  it.each([
    [{ activeOnly: false }, ['5', '6']],
    [{ activeOnly: true }, ['5']],
    [{ activeOnly: true, currentId: '6' }, ['5', '6']],
  ])('서울 아래 %j → %j', (opts, ids) => {
    expect(districtsOf(all, '1', opts).map((r) => r.id)).toEqual(ids);
  });
});

describe('blockingCount', () => {
  it.each([
    { name: '강남구', r: gangnam, n: 3 }, // 매장 수
    { name: '종로구', r: jongno, n: 0 },
    { name: '서울', r: seoul, n: 2 }, // 숨긴 종로구까지 센다
    { name: '경기', r: gyeonggi, n: 1 },
  ])('$name: 삭제를 막는 연결 수는 $n', ({ r, n }) => {
    expect(blockingCount(all, r)).toBe(n);
  });
});
