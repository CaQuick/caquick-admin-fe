import { Link } from '@tanstack/react-router';
import { StarIcon } from 'lucide-react';
import { type ReactNode } from 'react';

import { type AdminReviewCommentsQuery, type AdminReviewsQuery } from '@/graphql/generated/graphql';
import { formatCount } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { StatusPill } from '@/shared/ui/status-pill';

import { DeleteWithReason } from './delete-with-reason';
import { ReviewMediaList } from './review-media';

export type ReviewRow = AdminReviewsQuery['adminReviews']['items'][number];
export type CommentRow = AdminReviewCommentsQuery['adminReviewComments']['items'][number];

const linkClass = 'text-primary-soft-foreground hover:underline';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </>
  );
}

function Shell({
  open,
  onClose,
  title,
  description,
  deleted,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  deleted: boolean;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {title}
            {deleted && <StatusPill tone="negative">삭제됨</StatusPill>}
          </SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-6">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

/** 리뷰 목록 행을 눌렀을 때 여는 전문 보기. 목록 행 데이터로 그린다(단건 조회 없음) */
export function ReviewSheet({
  review,
  onClose,
}: {
  review: ReviewRow | undefined;
  onClose: () => void;
}) {
  return (
    <Shell
      open={review !== undefined}
      onClose={onClose}
      title={review ? `리뷰 #${review.id}` : ''}
      description={review ? `작성일 ${formatKst(review.createdAt, true)}` : ''}
      deleted={review?.deleted ?? false}
    >
      {review && (
        <>
          <p className="flex items-center gap-1 text-sm">
            <StarIcon className="size-4 fill-caution text-caution" aria-hidden />
            <span className="tabular-nums">평점 {review.rating.toFixed(1)}</span>
          </p>
          <p className="rounded-md bg-surface-tint px-3 py-2 text-sm whitespace-pre-line">
            {review.content ?? '작성한 본문이 없습니다.'}
          </p>
          <section>
            <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">사진·동영상</h3>
            <ReviewMediaList media={review.media} />
          </section>
          <dl className="grid grid-cols-[80px_1fr] gap-x-3 gap-y-1.5 text-sm">
            <Field label="작성자">
              <Link
                to="/users/$accountId"
                params={{ accountId: review.authorAccountId }}
                className={linkClass}
              >
                {review.authorNickname ?? `#${review.authorAccountId}`}
              </Link>
            </Field>
            <Field label="매장">
              <Link
                to="/stores/$storeId"
                params={{ storeId: review.storeId }}
                className={linkClass}
              >
                {review.storeName}
              </Link>
            </Field>
            <Field label="상품">
              <Link
                to="/products/$productId"
                params={{ productId: review.productId }}
                className={linkClass}
              >
                {review.productName}
              </Link>
            </Field>
            <Field label="댓글">
              <Link to="/review-comments" search={{ reviewId: review.id }} className={linkClass}>
                {formatCount(review.commentCount)}개 보기
              </Link>
            </Field>
            <Field label="좋아요">{formatCount(review.likeCount)}개</Field>
          </dl>
          {!review.deleted && (
            <div className="flex items-center justify-end gap-2 border-t pt-3">
              <span className="text-xs text-muted-foreground">이 리뷰를 강제로 삭제합니다.</span>
              <DeleteWithReason kind="review" id={review.id} deleted={review.deleted} />
            </div>
          )}
        </>
      )}
    </Shell>
  );
}

/** 댓글 목록 행을 눌렀을 때 여는 전문 보기 */
export function CommentSheet({
  comment,
  onClose,
}: {
  comment: CommentRow | undefined;
  onClose: () => void;
}) {
  return (
    <Shell
      open={comment !== undefined}
      onClose={onClose}
      title={comment ? `댓글 #${comment.id}` : ''}
      description={comment ? `작성일 ${formatKst(comment.createdAt, true)}` : ''}
      deleted={comment?.deleted ?? false}
    >
      {comment && (
        <>
          <p className="rounded-md bg-surface-tint px-3 py-2 text-sm whitespace-pre-line">
            {comment.content}
          </p>
          <dl className="grid grid-cols-[80px_1fr] gap-x-3 gap-y-1.5 text-sm">
            <Field label="작성자">
              <Link
                to="/users/$accountId"
                params={{ accountId: comment.authorAccountId }}
                className={linkClass}
              >
                {comment.authorNickname ?? `#${comment.authorAccountId}`}
              </Link>
            </Field>
            <Field label="리뷰">
              <ReviewLink reviewId={comment.reviewId} className={linkClass} />
            </Field>
          </dl>
          {!comment.deleted && (
            <div className="flex items-center justify-end gap-2 border-t pt-3">
              <span className="text-xs text-muted-foreground">이 댓글을 강제로 삭제합니다.</span>
              <DeleteWithReason kind="comment" id={comment.id} deleted={comment.deleted} />
            </div>
          )}
        </>
      )}
    </Shell>
  );
}

/** 리뷰 목록을 그 리뷰 1건으로 거른다. 삭제된 리뷰도 찾도록 삭제 포함으로 연다 */
export function ReviewLink({ reviewId, className }: { reviewId: string; className?: string }) {
  return (
    <Link to="/reviews" search={{ reviewId, deleted: 'true' }} className={className}>
      리뷰 #{reviewId}
    </Link>
  );
}
