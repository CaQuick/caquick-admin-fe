import { z } from 'zod';

import { type AdminProductListInput } from '@/graphql/generated/graphql';
import {
  DEFAULT_LIMIT,
  keywordText,
  listSearchBase,
  optionalBoolText,
  optionalIdText,
} from '@/shared/lib/list-search';

export const productsSearchSchema = z.object({
  ...listSearchBase,
  q: keywordText,
  storeId: optionalIdText,
  active: optionalBoolText,
});
export type ProductsSearch = z.infer<typeof productsSearchSchema>;
export type ProductsSearchInput = z.input<typeof productsSearchSchema>;

export function toProductListInput(s: ProductsSearch): AdminProductListInput {
  return {
    limit: s.limit ?? DEFAULT_LIMIT,
    cursor: s.cursor ?? null,
    keyword: s.q ?? null,
    storeId: s.storeId ?? null,
    isActive: s.active === undefined ? null : s.active === 'true',
  };
}

export function hasProductFilters(s: ProductsSearch): boolean {
  return [s.q, s.storeId, s.active].some((v) => v !== undefined);
}
