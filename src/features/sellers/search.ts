import { z } from 'zod';

import { type AdminSellerListInput } from '@/graphql/generated/graphql';
import { DEFAULT_LIMIT, listSearchBase, optionalText } from '@/shared/lib/list-search';

export const sellersSearchSchema = z.object({
  ...listSearchBase,
  q: optionalText,
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING']).optional().catch(undefined),
});
export type SellersSearch = z.infer<typeof sellersSearchSchema>;
export type SellersSearchInput = z.input<typeof sellersSearchSchema>;

export function toSellerListInput(s: SellersSearch): AdminSellerListInput {
  return {
    limit: s.limit ?? DEFAULT_LIMIT,
    cursor: s.cursor ?? null,
    keyword: s.q ?? null,
    status: s.status ?? null,
  };
}

export function hasSellerFilters(s: SellersSearch): boolean {
  return s.q !== undefined || s.status !== undefined;
}
