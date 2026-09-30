import { z } from 'zod';

import {
  type AdminReviewCommentListInput,
  type AdminReviewListInput,
  type AdminReviewReportListInput,
  type ReviewMediaType,
} from '@/graphql/generated/graphql';
import {
  DEFAULT_LIMIT,
  keywordText,
  listSearchBase,
  optionalBoolText,
  optionalIdText,
} from '@/shared/lib/list-search';
import { type PillTone } from '@/shared/ui/status-pill';

export const REPORT_REASON: Record<string, string> = {
  SPAM: '스팸',
  ABUSE: '욕설·비방',
  INAPPROPRIATE: '부적절',
  OTHER: '기타',
};
export const REPORT_STATUS: Record<string, { label: string; tone: PillTone }> = {
  PENDING: { label: '대기', tone: 'caution' },
  RESOLVED: { label: '처리 완료(대상 삭제)', tone: 'negative' },
  REJECTED: { label: '반려', tone: 'neutral' },
};
export const TARGET_TYPE: Record<string, string> = { REVIEW: '리뷰', REVIEW_COMMENT: '댓글' };

export const reviewsSearchSchema = z.object({
  ...listSearchBase,
  q: keywordText,
  reviewId: optionalIdText,
  storeId: optionalIdText,
  accountId: optionalIdText,
  deleted: optionalBoolText,
});
export type ReviewsSearch = z.infer<typeof reviewsSearchSchema>;
export type ReviewsSearchInput = z.input<typeof reviewsSearchSchema>;
export function toReviewListInput(s: ReviewsSearch): AdminReviewListInput {
  return {
    limit: s.limit ?? DEFAULT_LIMIT,
    cursor: s.cursor ?? null,
    keyword: s.q ?? null,
    reviewId: s.reviewId ?? null,
    storeId: s.storeId ?? null,
    accountId: s.accountId ?? null,
    includeDeleted: s.deleted === 'true',
  };
}

export const commentsSearchSchema = z.object({
  ...listSearchBase,
  reviewId: optionalIdText,
  accountId: optionalIdText,
  deleted: optionalBoolText,
});
export type CommentsSearch = z.infer<typeof commentsSearchSchema>;
export type CommentsSearchInput = z.input<typeof commentsSearchSchema>;
export function toCommentListInput(s: CommentsSearch): AdminReviewCommentListInput {
  return {
    limit: s.limit ?? DEFAULT_LIMIT,
    cursor: s.cursor ?? null,
    reviewId: s.reviewId ?? null,
    accountId: s.accountId ?? null,
    includeDeleted: s.deleted === 'true',
  };
}

/** status 미지정은 BE 기본 PENDING. "전체"는 명시적으로 null을 보낸다(all=true). */
export const reportsSearchSchema = z.object({
  ...listSearchBase,
  status: z.enum(['PENDING', 'RESOLVED', 'REJECTED']).optional().catch(undefined),
  all: optionalBoolText,
  targetType: z.enum(['REVIEW', 'REVIEW_COMMENT']).optional().catch(undefined),
});
export type ReportsSearch = z.infer<typeof reportsSearchSchema>;
export type ReportsSearchInput = z.input<typeof reportsSearchSchema>;
export function toReportListInput(s: ReportsSearch): AdminReviewReportListInput {
  return {
    limit: s.limit ?? DEFAULT_LIMIT,
    cursor: s.cursor ?? null,
    status: s.all === 'true' ? null : (s.status ?? 'PENDING'),
    targetType: s.targetType ?? null,
  };
}

/** 목록 행의 첨부 개수 요약(예: '사진 3 · 동영상 1'). 없으면 null */
export function mediaSummary(media: readonly { mediaType: ReviewMediaType }[]): string | null {
  const videos = media.filter((m) => m.mediaType === 'VIDEO').length;
  const photos = media.length - videos;
  const parts = [photos > 0 && `사진 ${photos}`, videos > 0 && `동영상 ${videos}`].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}
