import {
  type AdminDashboardSummaryQuery,
  type AdminSearchKeywordSnapshotQuery,
} from '@/graphql/generated/graphql';

export type DashboardSummary = AdminDashboardSummaryQuery['adminDashboardSummary'];
export type KeywordSnapshot = AdminSearchKeywordSnapshotQuery['adminSearchKeywordSnapshot'];
