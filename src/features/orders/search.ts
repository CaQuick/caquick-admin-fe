import { z } from 'zod';

import { type AdminOrderListInput } from '@/graphql/generated/graphql';
import { kstDayEndIso, kstDayStartIso, parseYmd } from '@/shared/lib/kst';
import { DEFAULT_LIMIT, listSearchBase, optionalText } from '@/shared/lib/list-search';

import { ORDER_STATUS_VALUES } from './status';

export const ordersSearchSchema = z.object({
  ...listSearchBase,
  q: optionalText,
  status: z.enum(ORDER_STATUS_VALUES).optional().catch(undefined),
  storeId: optionalText,
  accountId: optionalText,
  from: optionalText,
  to: optionalText,
});
export type OrdersSearch = z.infer<typeof ordersSearchSchema>;
export type OrdersSearchInput = z.input<typeof ordersSearchSchema>;

/** URL 검색 파라미터 → BE 입력. 날짜는 KST 하루 경계, 잘못된 날짜는 무시. */
export function toOrderListInput(s: OrdersSearch): AdminOrderListInput {
  const from = s.from ? parseYmd(s.from) : null;
  const to = s.to ? parseYmd(s.to) : null;
  return {
    limit: s.limit ?? DEFAULT_LIMIT,
    cursor: s.cursor ?? null,
    keyword: s.q ?? null,
    status: s.status ?? null,
    storeId: s.storeId ?? null,
    accountId: s.accountId ?? null,
    fromCreatedAt: from ? kstDayStartIso(from) : null,
    toCreatedAt: to ? kstDayEndIso(to) : null,
  };
}

export function hasOrderFilters(s: OrdersSearch): boolean {
  return [s.q, s.status, s.storeId, s.accountId, s.from, s.to].some((v) => v !== undefined);
}
