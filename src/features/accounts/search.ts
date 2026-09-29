import { z } from 'zod';

import { type AdminUserListInput } from '@/graphql/generated/graphql';
import { DEFAULT_LIMIT, keywordText, listSearchBase } from '@/shared/lib/list-search';

import { ACCOUNT_STATUS_VALUES } from './status';

export const usersSearchSchema = z.object({
  ...listSearchBase,
  q: keywordText,
  status: z.enum(ACCOUNT_STATUS_VALUES).optional().catch(undefined),
});
export type UsersSearch = z.infer<typeof usersSearchSchema>;
export type UsersSearchInput = z.input<typeof usersSearchSchema>;

export function toUserListInput(s: UsersSearch): AdminUserListInput {
  return {
    limit: s.limit ?? DEFAULT_LIMIT,
    cursor: s.cursor ?? null,
    keyword: s.q ?? null,
    status: s.status ?? null,
  };
}

export function hasUserFilters(s: UsersSearch): boolean {
  return s.q !== undefined || s.status !== undefined;
}
