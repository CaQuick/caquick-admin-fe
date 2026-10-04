import { type QueryClient, queryOptions } from '@tanstack/react-query';

import { graphql } from '@/graphql/generated';
import {
  type AdminCreateSearchKeywordChipInput,
  type AdminUpdateSearchKeywordChipInput,
} from '@/graphql/generated/graphql';
import { gqlRequest } from '@/shared/api';

const searchChipsKeys = {
  all: ['search-chips'] as const,
  list: () => [...searchChipsKeys.all, 'list'] as const,
};

const AdminSearchKeywordChipsDocument = graphql(/* GraphQL */ `
  query AdminSearchKeywordChips {
    adminSearchKeywordChips {
      id
      keyword
      sortOrder
      isActive
      startsAt
      endsAt
      createdAt
      updatedAt
    }
  }
`);
const AdminCreateSearchKeywordChipDocument = graphql(/* GraphQL */ `
  mutation AdminCreateSearchKeywordChip($input: AdminCreateSearchKeywordChipInput!) {
    adminCreateSearchKeywordChip(input: $input) {
      id
      keyword
    }
  }
`);
const AdminUpdateSearchKeywordChipDocument = graphql(/* GraphQL */ `
  mutation AdminUpdateSearchKeywordChip($input: AdminUpdateSearchKeywordChipInput!) {
    adminUpdateSearchKeywordChip(input: $input) {
      id
      keyword
    }
  }
`);
const AdminDeleteSearchKeywordChipDocument = graphql(/* GraphQL */ `
  mutation AdminDeleteSearchKeywordChip($chipId: ID!) {
    adminDeleteSearchKeywordChip(chipId: $chipId)
  }
`);
const AdminReorderSearchKeywordChipsDocument = graphql(/* GraphQL */ `
  mutation AdminReorderSearchKeywordChips($input: AdminReorderSearchKeywordChipsInput!) {
    adminReorderSearchKeywordChips(input: $input) {
      id
    }
  }
`);

/** 삭제 제외 전체를 노출 순서대로. 순서 저장은 이 목록 전체 ID를 보낸다 */
export function searchChipsQueryOptions() {
  return queryOptions({
    queryKey: searchChipsKeys.list(),
    queryFn: async () =>
      (await gqlRequest(AdminSearchKeywordChipsDocument)).adminSearchKeywordChips,
  });
}

const invalidate = (qc: QueryClient) => qc.invalidateQueries({ queryKey: searchChipsKeys.list() });

export const searchChipMutations = {
  create: async (qc: QueryClient, input: AdminCreateSearchKeywordChipInput) => {
    const r = (await gqlRequest(AdminCreateSearchKeywordChipDocument, { input }))
      .adminCreateSearchKeywordChip;
    await invalidate(qc);
    return r;
  },
  update: async (qc: QueryClient, input: AdminUpdateSearchKeywordChipInput) => {
    const r = (await gqlRequest(AdminUpdateSearchKeywordChipDocument, { input }))
      .adminUpdateSearchKeywordChip;
    await invalidate(qc);
    return r;
  },
  remove: async (qc: QueryClient, chipId: string) => {
    const r = (await gqlRequest(AdminDeleteSearchKeywordChipDocument, { chipId }))
      .adminDeleteSearchKeywordChip;
    await invalidate(qc);
    return r;
  },
  reorder: async (qc: QueryClient, chipIds: string[]) => {
    const r = (await gqlRequest(AdminReorderSearchKeywordChipsDocument, { input: { chipIds } }))
      .adminReorderSearchKeywordChips;
    await invalidate(qc);
    return r;
  },
  /** 다른 관리자가 바꾼 목록을 다시 받는다 */
  refresh: invalidate,
};
