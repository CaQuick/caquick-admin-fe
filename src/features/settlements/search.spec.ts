import {
  currentKstMonth,
  hasSettlementFilters,
  mondayOf,
  monthlySearchSchema,
  settlementsSearchSchema,
  shiftMonth,
  toSettlementListInput,
} from './search';
import { actorLabel, settlementStatusMeta } from './status';

describe('정산 목록 검색', () => {
  it('빈 파라미터는 기본 limit 20·필터 없음(null = 전체)', () => {
    const s = settlementsSearchSchema.parse({});
    expect(toSettlementListInput(s)).toEqual({
      limit: 20,
      cursor: null,
      status: null,
      storeId: null,
      periodStart: null,
    });
    expect(hasSettlementFilters(s)).toBe(false);
  });

  it('상태·매장 "0"·기간을 그대로 싣는다', () => {
    const s = settlementsSearchSchema.parse({
      status: 'PENDING',
      storeId: '0',
      periodStart: '2026-11-09',
      cursor: 'c',
    });
    expect(toSettlementListInput(s)).toEqual({
      limit: 20,
      cursor: 'c',
      status: 'PENDING',
      storeId: '0',
      periodStart: '2026-11-09',
    });
    expect(hasSettlementFilters(s)).toBe(true);
  });

  it('모르는 상태·날짜가 아닌 기간·숫자가 아닌 매장은 버린다', () => {
    const s = settlementsSearchSchema.parse({
      status: 'NOPE',
      periodStart: '2026-02-30',
      storeId: 'abc',
    });
    expect([s.status, s.periodStart, s.storeId]).toEqual([undefined, undefined, undefined]);
  });

  it.each([
    ['2026-11-09', '2026-11-09'], // 월요일
    ['2026-11-15', '2026-11-09'], // 일요일은 그 주 월요일
    ['2026-11-11', '2026-11-09'],
    ['2026-01-01', '2025-12-29'], // 해를 넘는다
    ['2024-03-03', '2024-02-26'], // 윤년 2월
    ['', undefined],
    ['2026-13-01', undefined],
  ])('%s의 정산 주 → %s', (ymd, monday) => {
    expect(mondayOf(ymd)).toBe(monday);
  });
});

describe('월 수수료 검색', () => {
  it.each([
    ['2026-11', '2026-11'],
    ['2026-13', undefined],
    ['2026-1', undefined],
    ['', undefined],
  ])('month=%s → %s', (month, want) => {
    expect(monthlySearchSchema.parse({ month }).month).toBe(want);
  });

  it.each([
    ['2026-01', -1, '2025-12'],
    ['2026-12', 1, '2027-01'],
    ['2026-05', 0, '2026-05'],
    ['2026-03', -14, '2025-01'],
  ])('%s %+i달 → %s', (month, delta, want) => {
    expect(shiftMonth(month, delta)).toBe(want);
  });

  it('이번 달은 KST 기준이다(UTC 11-30 15:00 = KST 12-01 00:00)', () => {
    expect(currentKstMonth(new Date('2026-11-30T14:59:59.999Z'))).toBe('2026-11');
    expect(currentKstMonth(new Date('2026-11-30T15:00:00.000Z'))).toBe('2026-12');
  });
});

describe('정산 라벨', () => {
  it('모르는 값과 프로토타입 키는 원문으로 보인다', () => {
    expect(settlementStatusMeta('PENDING')).toEqual({ label: '송금 대기', tone: 'caution' });
    expect(settlementStatusMeta('PAID').label).toBe('송금 완료');
    expect(settlementStatusMeta('HELD')).toEqual({ label: 'HELD', tone: 'neutral' });
    expect(settlementStatusMeta('constructor').label).toBe('constructor');
    expect(actorLabel('SELLER')).toBe('판매자');
    expect(actorLabel('ADMIN')).toBe('관리자');
    expect(actorLabel('toString')).toBe('toString');
  });
});
