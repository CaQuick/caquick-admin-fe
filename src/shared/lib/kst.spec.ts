import {
  addDays,
  formatKst,
  formatYmd,
  kstDayEndIso,
  kstDayStartIso,
  parseYmd,
  todayKst,
} from './kst';

describe('kst', () => {
  it('todayKst는 UTC 자정 직전에도 KST 날짜를 준다', () => {
    expect(todayKst(new Date('2026-09-27T15:30:00.000Z'))).toEqual({ y: 2026, m: 9, d: 28 });
    expect(todayKst(new Date('2026-09-27T14:59:59.999Z'))).toEqual({ y: 2026, m: 9, d: 27 });
  });

  it('addDays는 월·연 경계를 넘는다', () => {
    expect(formatYmd(addDays({ y: 2026, m: 1, d: 1 }, -1))).toBe('2025-12-31');
    expect(formatYmd(addDays({ y: 2026, m: 2, d: 28 }, 1))).toBe('2026-03-01');
  });

  it.each([
    ['2026-09-27', true],
    ['2026-02-30', false],
    ['2026-9-7', false],
    ['abc', false],
  ])('parseYmd(%s) 유효=%s', (s, ok) => {
    expect(parseYmd(s) !== null).toBe(ok);
  });

  it('KST 하루 경계를 UTC ISO로 바꾼다(양끝 포함)', () => {
    const d = { y: 2026, m: 9, d: 27 };
    expect(kstDayStartIso(d)).toBe('2026-09-26T15:00:00.000Z');
    expect(kstDayEndIso(d)).toBe('2026-09-27T14:59:59.999Z');
  });

  it('formatKst는 UTC ISO를 KST 표시로', () => {
    expect(formatKst('2026-09-27T08:05:00.000Z')).toBe('09-27 17:05');
    expect(formatKst('2026-12-31T15:00:00.000Z', true)).toBe('2027-01-01 00:00');
  });
});
