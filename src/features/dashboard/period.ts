import { z } from 'zod';

import {
  type YmdDate,
  addDays,
  formatYmd,
  kstDayEndIso,
  kstDayStartIso,
  parseYmd,
  todayKst,
} from '@/shared/lib/kst';

export const PRESETS = ['today', '7d', '30d', 'custom'] as const;
export type Preset = (typeof PRESETS)[number];

export const PRESET_LABEL: Record<Preset, string> = {
  today: '오늘',
  '7d': '7일',
  '30d': '30일',
  custom: '직접',
};

export const periodSearchSchema = z.object({
  period: z.enum(PRESETS).optional().catch(undefined),
  from: z.string().optional().catch(undefined),
  to: z.string().optional().catch(undefined),
});
export type PeriodSearch = z.infer<typeof periodSearchSchema>;

export interface ResolvedPeriod {
  preset: Preset;
  fromDate: YmdDate;
  toDate: YmdDate;
  /** BE에 보내는 값 */
  fromIso: string;
  toIso: string;
}

/** 검색 파라미터 → 기간. 잘못된 값·366일 초과·역순은 7일로 되돌린다(BE가 BAD_USER_INPUT을 주기 전에). */
export function resolvePeriod(search: PeriodSearch, now: Date = new Date()): ResolvedPeriod {
  const today = todayKst(now);
  const build = (preset: Preset, fromDate: YmdDate, toDate: YmdDate): ResolvedPeriod => ({
    preset,
    fromDate,
    toDate,
    fromIso: kstDayStartIso(fromDate),
    toIso: kstDayEndIso(toDate),
  });
  if (search.period === 'custom' && search.from && search.to) {
    const f = parseYmd(search.from);
    const t = parseYmd(search.to);
    if (f && t) {
      const days = (Date.UTC(t.y, t.m - 1, t.d) - Date.UTC(f.y, f.m - 1, f.d)) / 86_400_000;
      if (days >= 0 && days <= 365) return build('custom', f, t);
    }
  }
  if (search.period === 'today') return build('today', today, today);
  if (search.period === '30d') return build('30d', addDays(today, -29), today);
  return build('7d', addDays(today, -6), today);
}

export function periodLabel(p: ResolvedPeriod): string {
  return `${formatYmd(p.fromDate)} ~ ${formatYmd(p.toDate)}`;
}
