import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { type ColumnDef } from '@tanstack/react-table';
import { StarIcon } from 'lucide-react';

import { type AdminReviewsQuery } from '@/graphql/generated/graphql';
import { messageFor } from '@/shared/api';
import { formatCount } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { DataTable } from '@/shared/ui/data-table';
import { FilterBar } from '@/shared/ui/filter-bar';
import { IdFilterInput } from '@/shared/ui/id-filter-input';
import { Label } from '@/shared/ui/label';
import { PageHeader } from '@/shared/ui/page-header';
import { StatusPill } from '@/shared/ui/status-pill';
import { Switch } from '@/shared/ui/switch';

import { reviewsQueryOptions } from '../api/queries';
import { DeleteWithReason } from '../components/delete-with-reason';
import { ListShell } from '../components/list-shell';
import { type ReviewsSearch, type ReviewsSearchInput, toReviewListInput } from '../meta';

type Row = AdminReviewsQuery['adminReviews']['items'][number];

const columns: ColumnDef<Row, unknown>[] = [
  {
    accessorKey: 'content',
    header: '내용',
    cell: ({ row }) => (
      <span className="flex max-w-96 flex-col">
        <span className="flex items-center gap-1 text-xs">
          <StarIcon className="size-3 fill-caution text-caution" aria-hidden />
          <span className="tabular-nums">{row.original.rating.toFixed(1)}</span>
          {row.original.deleted && <StatusPill tone="negative">삭제됨</StatusPill>}
        </span>
        <span className="truncate">{row.original.content ?? '(내용 없음)'}</span>
      </span>
    ),
  },
  {
    accessorKey: 'authorNickname',
    header: '작성자',
    cell: ({ row }) => (
      <Link
        to="/users/$accountId"
        params={{ accountId: row.original.authorAccountId }}
        className="hover:underline"
      >
        {row.original.authorNickname ?? `#${row.original.authorAccountId}`}
      </Link>
    ),
  },
  {
    accessorKey: 'storeName',
    header: '매장 · 상품',
    cell: ({ row }) => (
      <span>
        <Link
          to="/stores/$storeId"
          params={{ storeId: row.original.storeId }}
          className="hover:underline"
        >
          {row.original.storeName}
        </Link>
        <Link
          to="/products/$productId"
          params={{ productId: row.original.productId }}
          className="block text-[11.5px] text-muted-foreground hover:underline"
        >
          상품 #{row.original.productId}
        </Link>
      </span>
    ),
  },
  {
    id: 'counts',
    header: '댓글 · 좋아요',
    meta: { align: 'right' },
    cell: ({ row }) =>
      `${formatCount(row.original.commentCount)} · ${formatCount(row.original.likeCount)}`,
  },
  {
    accessorKey: 'createdAt',
    header: '작성',
    cell: ({ row }) => formatKst(row.original.createdAt),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <Link
          to="/review-comments"
          search={{ reviewId: row.original.id }}
          className="self-center text-xs text-primary-soft-foreground hover:underline"
        >
          댓글
        </Link>
        <DeleteWithReason kind="review" id={row.original.id} deleted={row.original.deleted} />
      </div>
    ),
  },
];

export function ReviewsPage({
  search,
  onSearchChange,
}: {
  search: ReviewsSearch;
  onSearchChange: (next: ReviewsSearchInput) => void;
}) {
  const list = useQuery(reviewsQueryOptions(toReviewListInput(search)));
  const patch = (p: Partial<ReviewsSearchInput>) =>
    onSearchChange({ ...search, ...p, cursor: undefined });
  return (
    <>
      <PageHeader
        title="리뷰"
        meta={list.data ? `전체 ${formatCount(list.data.totalCount)}건` : undefined}
      />
      <ListShell
        data={list.data}
        isFetching={list.isFetching}
        isError={list.isError}
        errorMessage={list.error ? messageFor(list.error) : ''}
        search={search}
        onCursor={(cursor) => onSearchChange({ ...search, cursor })}
        filters={
          <FilterBar
            keyword={search.q ?? ''}
            keywordPlaceholder="리뷰 본문"
            onKeywordSubmit={(q) => patch({ q: q || undefined })}
            hasActiveFilters={[search.q, search.storeId, search.accountId, search.deleted].some(
              (v) => v !== undefined,
            )}
            onReset={() => onSearchChange({ limit: search.limit })}
          >
            <IdFilterInput
              label="매장 ID"
              value={search.storeId}
              onCommit={(v) => patch({ storeId: v })}
            />
            <IdFilterInput
              label="작성자 계정 ID"
              placeholder="계정 ID"
              value={search.accountId}
              onCommit={(v) => patch({ accountId: v })}
            />
            <span className="flex items-center gap-1.5">
              <Switch
                id="rv-deleted"
                checked={search.deleted === 'true'}
                onCheckedChange={(v) => patch({ deleted: v ? 'true' : undefined })}
              />
              <Label htmlFor="rv-deleted" className="text-xs">
                삭제 포함
              </Label>
            </span>
          </FilterBar>
        }
      >
        <DataTable
          columns={columns}
          data={list.data?.items ?? []}
          getRowId={(r) => r.id}
          isLoading={list.isPending}
          emptyMessage="리뷰가 없습니다."
        />
      </ListShell>
    </>
  );
}
