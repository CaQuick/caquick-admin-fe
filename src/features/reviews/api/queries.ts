import { type QueryClient, queryOptions } from '@tanstack/react-query';

import { graphql } from '@/graphql/generated';
import {
  type AdminResolveReviewReportInput,
  type AdminReviewCommentListInput,
  type AdminReviewListInput,
  type AdminReviewReportListInput,
} from '@/graphql/generated/graphql';
import { gqlRequest } from '@/shared/api';

const keys = {
  reviews: (input: AdminReviewListInput) => ['reviews', 'list', input] as const,
  comments: (input: AdminReviewCommentListInput) => ['review-comments', 'list', input] as const,
  reports: (input: AdminReviewReportListInput) => ['review-reports', 'list', input] as const,
  report: (reportId: string) => ['review-reports', 'detail', reportId] as const,
};

const AdminReviewsDocument = graphql(/* GraphQL */ `
  query AdminReviews($input: AdminReviewListInput) {
    adminReviews(input: $input) {
      items {
        id
        storeId
        storeName
        productId
        authorAccountId
        authorNickname
        rating
        content
        commentCount
        likeCount
        deleted
        createdAt
      }
      totalCount
      hasMore
      nextCursor
    }
  }
`);
const AdminReviewCommentsDocument = graphql(/* GraphQL */ `
  query AdminReviewComments($input: AdminReviewCommentListInput) {
    adminReviewComments(input: $input) {
      items {
        id
        reviewId
        authorAccountId
        authorNickname
        content
        deleted
        createdAt
      }
      totalCount
      hasMore
      nextCursor
    }
  }
`);
const AdminReviewReportsDocument = graphql(/* GraphQL */ `
  query AdminReviewReports($input: AdminReviewReportListInput) {
    adminReviewReports(input: $input) {
      items {
        id
        targetType
        targetId
        reporterAccountId
        reason
        detail
        contentSnapshot
        status
        resolvedByAccountId
        resolvedAt
        resolutionNote
        createdAt
      }
      totalCount
      hasMore
      nextCursor
    }
  }
`);
const AdminReviewReportDocument = graphql(/* GraphQL */ `
  query AdminReviewReport($reportId: ID!) {
    adminReviewReport(reportId: $reportId) {
      report {
        id
        targetType
        targetId
        reporterAccountId
        reason
        detail
        contentSnapshot
        status
        resolvedByAccountId
        resolvedAt
        resolutionNote
        createdAt
      }
      target {
        id
        reviewId
        authorAccountId
        authorNickname
        content
        storeId
        deleted
      }
    }
  }
`);
const AdminDeleteReviewDocument = graphql(/* GraphQL */ `
  mutation AdminDeleteReview($input: AdminDeleteReviewInput!) {
    adminDeleteReview(input: $input)
  }
`);
const AdminDeleteReviewCommentDocument = graphql(/* GraphQL */ `
  mutation AdminDeleteReviewComment($input: AdminDeleteReviewCommentInput!) {
    adminDeleteReviewComment(input: $input)
  }
`);
const AdminResolveReviewReportDocument = graphql(/* GraphQL */ `
  mutation AdminResolveReviewReport($input: AdminResolveReviewReportInput!) {
    adminResolveReviewReport(input: $input) {
      id
      status
    }
  }
`);

export function reviewsQueryOptions(input: AdminReviewListInput) {
  return queryOptions({
    queryKey: keys.reviews(input),
    queryFn: async () => (await gqlRequest(AdminReviewsDocument, { input })).adminReviews,
    placeholderData: (p) => p,
  });
}
export function commentsQueryOptions(input: AdminReviewCommentListInput) {
  return queryOptions({
    queryKey: keys.comments(input),
    queryFn: async () =>
      (await gqlRequest(AdminReviewCommentsDocument, { input })).adminReviewComments,
    placeholderData: (p) => p,
  });
}
export function reportsQueryOptions(input: AdminReviewReportListInput) {
  return queryOptions({
    queryKey: keys.reports(input),
    queryFn: async () =>
      (await gqlRequest(AdminReviewReportsDocument, { input })).adminReviewReports,
    placeholderData: (p) => p,
  });
}
export function reportDetailQueryOptions(reportId: string) {
  return queryOptions({
    queryKey: keys.report(reportId),
    queryFn: async () =>
      (await gqlRequest(AdminReviewReportDocument, { reportId })).adminReviewReport,
  });
}

/** 삭제·신고 처리는 리뷰·댓글·신고 목록에 서로 영향을 준다(신고가 RESOLVED로 닫힘) — 셋 다 무효화. */
async function invalidateAll(qc: QueryClient) {
  await Promise.all([
    qc.invalidateQueries({ queryKey: ['reviews'] }),
    qc.invalidateQueries({ queryKey: ['review-comments'] }),
    qc.invalidateQueries({ queryKey: ['review-reports'] }),
  ]);
}
export async function deleteReview(qc: QueryClient, reviewId: string, reason: string) {
  const r = (await gqlRequest(AdminDeleteReviewDocument, { input: { reviewId, reason } }))
    .adminDeleteReview;
  await invalidateAll(qc);
  return r;
}
export async function deleteReviewComment(qc: QueryClient, commentId: string, reason: string) {
  const r = (await gqlRequest(AdminDeleteReviewCommentDocument, { input: { commentId, reason } }))
    .adminDeleteReviewComment;
  await invalidateAll(qc);
  return r;
}
export async function resolveReport(qc: QueryClient, input: AdminResolveReviewReportInput) {
  const r = (await gqlRequest(AdminResolveReviewReportDocument, { input }))
    .adminResolveReviewReport;
  await invalidateAll(qc);
  return r;
}
