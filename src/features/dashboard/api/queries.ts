import { queryOptions } from '@tanstack/react-query';

import { graphql } from '@/graphql/generated';
import { gqlRequest } from '@/shared/api';

const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (from: string, to: string) => [...dashboardKeys.all, 'summary', from, to] as const,
  keywords: (rankedAt: string | null, limit: number) =>
    [...dashboardKeys.all, 'keywords', rankedAt, limit] as const,
};

const AdminDashboardSummaryDocument = graphql(/* GraphQL */ `
  query AdminDashboardSummary($input: AdminDashboardSummaryInput!) {
    adminDashboardSummary(input: $input) {
      from
      to
      newUserCount
      newSellerCount
      orderCounts {
        submitted
        confirmed
        made
        pickedUp
        canceled
      }
      orderAmountSum
      activeStoreCount
      activeProductCount
      pendingReportCount
    }
  }
`);

const AdminSearchKeywordSnapshotDocument = graphql(/* GraphQL */ `
  query AdminSearchKeywordSnapshot($input: AdminSearchKeywordSnapshotInput) {
    adminSearchKeywordSnapshot(input: $input) {
      rankedAt
      items {
        rank
        keyword
        searchCount
      }
    }
  }
`);

/** from·to는 UTC ISO(KST 경계를 변환한 값). */
export function dashboardSummaryQueryOptions(from: string, to: string) {
  return queryOptions({
    queryKey: dashboardKeys.summary(from, to),
    queryFn: async () =>
      (await gqlRequest(AdminDashboardSummaryDocument, { input: { from, to } }))
        .adminDashboardSummary,
  });
}

export function searchKeywordQueryOptions(rankedAt: string | null = null, limit = 10) {
  return queryOptions({
    queryKey: dashboardKeys.keywords(rankedAt, limit),
    queryFn: async () =>
      (await gqlRequest(AdminSearchKeywordSnapshotDocument, { input: { rankedAt, limit } }))
        .adminSearchKeywordSnapshot,
  });
}
