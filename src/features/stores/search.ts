import { z } from 'zod';

import { type AdminStoreListInput } from '@/graphql/generated/graphql';
import {
  DEFAULT_LIMIT,
  keywordText,
  listSearchBase,
  optionalBoolText,
  optionalIdText,
} from '@/shared/lib/list-search';

export const storesSearchSchema = z.object({
  ...listSearchBase,
  q: keywordText,
  active: optionalBoolText,
  regionId: optionalIdText,
});
export type StoresSearch = z.infer<typeof storesSearchSchema>;
export type StoresSearchInput = z.input<typeof storesSearchSchema>;

export function toStoreListInput(s: StoresSearch): AdminStoreListInput {
  return {
    limit: s.limit ?? DEFAULT_LIMIT,
    cursor: s.cursor ?? null,
    keyword: s.q ?? null,
    isActive: s.active === undefined ? null : s.active === 'true',
    regionId: s.regionId ?? null,
  };
}

export function hasStoreFilters(s: StoresSearch): boolean {
  return [s.q, s.active, s.regionId].some((v) => v !== undefined);
}
