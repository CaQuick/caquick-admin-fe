import { periodLabel, periodSearchSchema, resolvePeriod } from './period';

const now = new Date('2026-09-27T03:00:00.000Z'); // KST 09-27 12:00

describe('resolvePeriod', () => {
  it('기본은 7일(오늘 포함)', () => {
    const p = resolvePeriod({}, now);
    expect(p.preset).toBe('7d');
    expect(periodLabel(p)).toBe('2026-09-21 ~ 2026-09-27');
    expect(p.fromIso).toBe('2026-09-20T15:00:00.000Z');
    expect(p.toIso).toBe('2026-09-27T14:59:59.999Z');
  });

  it.each([
    ['today', '2026-09-27 ~ 2026-09-27'],
    ['30d', '2026-08-29 ~ 2026-09-27'],
  ] as const)('프리셋 %s', (period, label) => {
    expect(periodLabel(resolvePeriod({ period }, now))).toBe(label);
  });

  it('기간 지정은 from·to를 쓰고, 역순·366일 초과·형식 오류는 7일로', () => {
    expect(
      periodLabel(resolvePeriod({ period: 'custom', from: '2026-09-01', to: '2026-09-10' }, now)),
    ).toBe('2026-09-01 ~ 2026-09-10');
    expect(
      resolvePeriod({ period: 'custom', from: '2026-09-10', to: '2026-09-01' }, now).preset,
    ).toBe('7d');
    expect(
      resolvePeriod({ period: 'custom', from: '2025-01-01', to: '2026-09-01' }, now).preset,
    ).toBe('7d');
    expect(
      resolvePeriod({ period: 'custom', from: '2026-02-30', to: '2026-09-01' }, now).preset,
    ).toBe('7d');
    expect(resolvePeriod({ period: 'custom' }, now).preset).toBe('7d');
  });

  it('검색 파라미터 스키마는 이상한 값을 버린다', () => {
    expect(periodSearchSchema.parse({ period: 'weird', from: 1 })).toEqual({
      period: undefined,
      from: undefined,
      to: undefined,
    });
  });
});
