import { z } from 'zod';

import { type AdminSettlementListInput } from '@/graphql/generated/graphql';
import { addDays, formatYmd, parseYmd, todayKst } from '@/shared/lib/kst';
import {
  DEFAULT_LIMIT,
  listSearchBase,
  optionalIdText,
  optionalText,
} from '@/shared/lib/list-search';

import { SETTLEMENT_STATUS_VALUES } from './status';

export const settlementsSearchSchema = z.object({
  ...listSearchBase,
  status: z.enum(SETTLEMENT_STATUS_VALUES).optional().catch(undefined),
  storeId: optionalIdText,
  periodStart: optionalText.refine((v) => v === undefined || parseYmd(v) !== null).catch(undefined),
});
export type SettlementsSearch = z.infer<typeof settlementsSearchSchema>;
export type SettlementsSearchInput = z.input<typeof settlementsSearchSchema>;

export function toSettlementListInput(s: SettlementsSearch): AdminSettlementListInput {
  return {
    limit: s.limit ?? DEFAULT_LIMIT,
    cursor: s.cursor ?? null,
    status: s.status ?? null,
    storeId: s.storeId ?? null,
    periodStart: s.periodStart ?? null,
  };
}

export function hasSettlementFilters(s: SettlementsSearch): boolean {
  return [s.status, s.storeId, s.periodStart].some((v) => v !== undefined);
}

/** 정산 기간은 월요일에 시작한다. 고른 날짜를 그 주 월요일로 맞추고, 날짜가 아니면 undefined */
export function mondayOf(ymd: string): string | undefined {
  const d = parseYmd(ymd);
  if (!d) return undefined;
  const sundayFirst = new Date(Date.UTC(d.y, d.m - 1, d.d)).getUTCDay();
  return formatYmd(addDays(d, -((sundayFirst + 6) % 7)));
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

export const monthlySearchSchema = z.object({
  month: optionalText.refine((v) => v === undefined || MONTH.test(v)).catch(undefined),
});

export function currentKstMonth(now: Date = new Date()): string {
  const t = todayKst(now);
  return `${t.y}-${String(t.m).padStart(2, '0')}`;
}

/** 'YYYY-MM'에 delta달을 더한다 */
export function shiftMonth(month: string, delta: number): string {
  const [y = 0, m = 1] = month.split('-').map(Number);
  const index = y * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}
