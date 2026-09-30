import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { type ColumnDef } from '@tanstack/react-table';
import { ImageIcon, StarIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { BuyerRef } from '@/features/accounts';
import { messageFor } from '@/shared/api';
import { formatCount } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { DataTable } from '@/shared/ui/data-table';
import { EntityPicker } from '@/shared/ui/entity-picker';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterField } from '@/shared/ui/filter-field';
import { IdFilterInput } from '@/shared/ui/id-filter-input';
import { Label } from '@/shared/ui/label';
import { PageHeader } from '@/shared/ui/page-header';
import { StatusPill } from '@/shared/ui/status-pill';
import { Switch } from '@/shared/ui/switch';

import { authorPickerQuery, reviewsQueryOptions, storePickerQuery } from '../api/queries';
import { DeleteWithReason } from '../components/delete-with-reason';
import { ListShell } from '../components/list-shell';
import { type ReviewRow, ReviewSheet } from '../components/review-sheet';
import { StopRowClick } from '../components/stop-row-click';
import {
  type ReviewsSearch,
  type ReviewsSearchInput,
  mediaSummary,
  toReviewListInput,
} from '../meta';

function reviewColumns(open: (id: string) => void): ColumnDef<ReviewRow, unknown>[] {
  return [
    {
      accessorKey: 'content',
      header: '내용',
      cell: ({ row }) => {
        const media = mediaSummary(row.original.media);
        return (
          <span className="flex max-w-96 flex-col">
            <span className="flex items-center gap-1 text-xs">
              <StarIcon className="size-3 fill-caution text-caution" aria-hidden />
              <span className="tabular-nums">{row.original.rating.toFixed(1)}</span>
              {media && (
                <span className="ml-1 flex items-center gap-0.5 text-muted-foreground">
                  <ImageIcon className="size-3" aria-hidden />
                  {media}
                </span>
              )}
              {row.original.deleted && <StatusPill tone="negative">삭제됨</StatusPill>}
            </span>
            {/* 키보드로도 시트를 열 수 있게 본문을 버튼으로 둔다(행 클릭은 마우스용) */}
            <button
              type="button"
              className="truncate text-left hover:underline"
              aria-label={`리뷰 ${row.original.id} 전문 보기`}
              onClick={(e) => {
                e.stopPropagation();
                open(row.original.id);
              }}
            >
              {row.original.content ?? '(내용 없음)'}
            </button>
          </span>
        );
      },
    },
    {
      accessorKey: 'authorNickname',
      header: '작성자',
      cell: ({ row }) => (
        <StopRowClick>
          <BuyerRef
            accountId={row.original.authorAccountId}
            nickname={row.original.authorNickname}
          />
        </StopRowClick>
      ),
    },
    {
      accessorKey: 'storeName',
      header: '매장 · 상품',
      cell: ({ row }) => (
        <StopRowClick className="flex flex-col">
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
            className="max-w-56 truncate text-[11.5px] text-muted-foreground hover:underline"
          >
            {row.original.productName}
          </Link>
        </StopRowClick>
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
      header: '작성일',
      cell: ({ row }) => formatKst(row.original.createdAt),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <StopRowClick className="flex justify-end gap-1">
          <Link
            to="/review-comments"
            search={{ reviewId: row.original.id }}
            className="self-center text-xs text-primary-soft-foreground hover:underline"
          >
            댓글
          </Link>
          <DeleteWithReason kind="review" id={row.original.id} deleted={row.original.deleted} />
        </StopRowClick>
      ),
    },
  ];
}

export function ReviewsPage({
  search,
  onSearchChange,
}: {
  search: ReviewsSearch;
  onSearchChange: (next: ReviewsSearchInput) => void;
}) {
  const list = useQuery(reviewsQueryOptions(toReviewListInput(search)));
  const [openId, setOpenId] = useState<string>();
  const columns = useMemo(() => reviewColumns(setOpenId), []);
  const patch = (p: Partial<ReviewsSearchInput>) =>
    onSearchChange({ ...search, ...p, cursor: undefined });
  const items = list.data?.items ?? [];
  // 주소로 들어온 필터의 이름은 지금 목록 행에서 찾는다(없으면 선택기가 #id로 보인다)
  const storeName = items.find((r) => r.storeId === search.storeId)?.storeName;
  const authorName =
    items.find((r) => r.authorAccountId === search.accountId)?.authorNickname ?? undefined;
  return (
    <>
      <PageHeader
        title="리뷰"
        meta={list.data ? `전체 ${formatCount(list.data.totalCount)}건` : undefined}
        description="행을 누르면 본문 전체와 사진을 볼 수 있습니다."
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
            hasActiveFilters={[
              search.q,
              search.reviewId,
              search.storeId,
              search.accountId,
              search.deleted,
            ].some((v) => v !== undefined)}
            onReset={() => onSearchChange({ limit: search.limit })}
            trailing={
              <>
                <Switch
                  id="rv-deleted"
                  checked={search.deleted === 'true'}
                  onCheckedChange={(v) => patch({ deleted: v ? 'true' : undefined })}
                />
                <Label htmlFor="rv-deleted" className="text-xs">
                  삭제 포함
                </Label>
              </>
            }
          >
            <FilterField label="매장">
              <EntityPicker
                label="매장"
                value={search.storeId}
                selectedLabel={storeName}
                onChange={(id) => patch({ storeId: id })}
                searchQuery={storePickerQuery}
              />
            </FilterField>
            <FilterField label="작성자">
              <EntityPicker
                label="작성자"
                value={search.accountId}
                selectedLabel={authorName}
                onChange={(id) => patch({ accountId: id })}
                searchQuery={authorPickerQuery}
              />
            </FilterField>
            <FilterField label="리뷰 번호">
              <IdFilterInput
                label="리뷰 번호"
                placeholder="숫자"
                value={search.reviewId}
                onCommit={(v) => patch({ reviewId: v })}
              />
            </FilterField>
          </FilterBar>
        }
      >
        <DataTable
          columns={columns}
          data={items}
          getRowId={(r) => r.id}
          isLoading={list.isPending}
          emptyMessage="리뷰가 없습니다."
          onRowClick={(r) => setOpenId(r.id)}
        />
      </ListShell>
      <ReviewSheet
        review={openId === undefined ? undefined : items.find((r) => r.id === openId)}
        onClose={() => setOpenId(undefined)}
      />
    </>
  );
}
