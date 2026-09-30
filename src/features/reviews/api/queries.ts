import { type QueryClient, queryOptions } from '@tanstack/react-query';

import { graphql } from '@/graphql/generated';
import {
  type AdminResolveReviewReportInput,
  type AdminReviewCommentListInput,
  type AdminReviewListInput,
  type AdminReviewReportListInput,
} from '@/graphql/generated/graphql';
import { gqlRequest } from '@/shared/api';
import { type EntityOption } from '@/shared/ui/entity-picker';

const keys = {
  reviews: (input: AdminReviewListInput) => ['reviews', 'list', input] as const,
  storePicker: (keyword: string) => ['review-pickers', 'store', keyword] as const,
  authorPicker: (keyword: string) => ['review-pickers', 'author', keyword] as const,
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
        productName
        authorAccountId
        authorNickname
        rating
        content
        commentCount
        likeCount
        deleted
        media {
          mediaType
          mediaUrl
          thumbnailUrl
          sortOrder
        }
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
        reporterNickname
        reporterWithdrawn
        reason
        detail
        contentSnapshot
        status
        resolvedByAccountId
        resolvedByLabel
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
        reporterNickname
        reporterWithdrawn
        reason
        detail
        contentSnapshot
        status
        resolvedByAccountId
        resolvedByLabel
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
        storeName
        deleted
        media {
          mediaType
          mediaUrl
          thumbnailUrl
          sortOrder
        }
      }
    }
  }
`);
const AdminReviewStorePickerDocument = graphql(/* GraphQL */ `
  query AdminReviewStorePicker($input: AdminStoreListInput) {
    adminStores(input: $input) {
      items {
        id
        storeName
        isActive
      }
    }
  }
`);
const AdminReviewAuthorPickerDocument = graphql(/* GraphQL */ `
  query AdminReviewAuthorPicker($input: AdminUserListInput) {
    adminUsers(input: $input) {
      items {
        accountId
        nickname
        name
        email
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

const PICKER_LIMIT = 20;

/** 필터의 매장 선택기. 숨긴 매장의 리뷰도 거를 수 있어야 해서 노출 여부로 거르지 않는다 */
export function storePickerQuery(keyword: string) {
  return queryOptions({
    queryKey: keys.storePicker(keyword),
    queryFn: async () =>
      (
        await gqlRequest(AdminReviewStorePickerDocument, {
          input: { keyword: keyword || null, limit: PICKER_LIMIT },
        })
      ).adminStores.items,
    select: (items): EntityOption[] =>
      items.map((s) => ({
        id: s.id,
        label: s.storeName,
        description: s.isActive ? `#${s.id}` : `#${s.id} · 숨김`,
      })),
  });
}

/** 필터의 작성자(구매자) 선택기 */
export function authorPickerQuery(keyword: string) {
  return queryOptions({
    queryKey: keys.authorPicker(keyword),
    queryFn: async () =>
      (
        await gqlRequest(AdminReviewAuthorPickerDocument, {
          input: { keyword: keyword || null, limit: PICKER_LIMIT },
        })
      ).adminUsers.items,
    select: (items): EntityOption[] =>
      items.map((u) => ({
        id: u.accountId,
        label: u.nickname ?? u.name ?? u.email ?? `#${u.accountId}`,
        description: `#${u.accountId}`,
      })),
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
