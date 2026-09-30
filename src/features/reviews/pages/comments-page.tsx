import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
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

import { authorPickerQuery, commentsQueryOptions } from '../api/queries';
import { DeleteWithReason } from '../components/delete-with-reason';
import { ListShell } from '../components/list-shell';
import { type CommentRow, CommentSheet, ReviewLink } from '../components/review-sheet';
import { StopRowClick } from '../components/stop-row-click';
import { type CommentsSearch, type CommentsSearchInput, toCommentListInput } from '../meta';

function commentColumns(open: (id: string) => void): ColumnDef<CommentRow, unknown>[] {
  return [
    {
      accessorKey: 'content',
      header: '내용',
      cell: ({ row }) => (
        <span className="flex max-w-96 items-center gap-2">
          {row.original.deleted && <StatusPill tone="negative">삭제됨</StatusPill>}
          <button
            type="button"
            className="truncate text-left hover:underline"
            aria-label={`댓글 ${row.original.id} 전문 보기`}
            onClick={(e) => {
              e.stopPropagation();
              open(row.original.id);
            }}
          >
            {row.original.content}
          </button>
        </span>
      ),
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
      accessorKey: 'reviewId',
      header: '리뷰',
      cell: ({ row }) => (
        <StopRowClick>
          <ReviewLink
            reviewId={row.original.reviewId}
            className="text-muted-foreground hover:underline"
          />
        </StopRowClick>
      ),
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
        <StopRowClick className="flex justify-end">
          <DeleteWithReason kind="comment" id={row.original.id} deleted={row.original.deleted} />
        </StopRowClick>
      ),
    },
  ];
}

export function CommentsPage({
  search,
  onSearchChange,
}: {
  search: CommentsSearch;
  onSearchChange: (next: CommentsSearchInput) => void;
}) {
  const list = useQuery(commentsQueryOptions(toCommentListInput(search)));
  const [openId, setOpenId] = useState<string>();
  const columns = useMemo(() => commentColumns(setOpenId), []);
  const patch = (p: Partial<CommentsSearchInput>) =>
    onSearchChange({ ...search, ...p, cursor: undefined });
  const items = list.data?.items ?? [];
  const authorName =
    items.find((r) => r.authorAccountId === search.accountId)?.authorNickname ?? undefined;
  return (
    <>
      <PageHeader
        title="리뷰 댓글"
        meta={list.data ? `전체 ${formatCount(list.data.totalCount)}건` : undefined}
        description="행을 누르면 댓글 전체를 볼 수 있습니다."
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
            hasActiveFilters={[search.reviewId, search.accountId, search.deleted].some(
              (v) => v !== undefined,
            )}
            onReset={() => onSearchChange({ limit: search.limit })}
          >
            <FilterField label="리뷰 번호">
              <IdFilterInput
                label="리뷰 번호"
                placeholder="숫자"
                value={search.reviewId}
                onCommit={(v) => patch({ reviewId: v })}
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
            <span className="ml-auto flex items-center gap-1.5">
              <Switch
                id="rc-deleted"
                checked={search.deleted === 'true'}
                onCheckedChange={(v) => patch({ deleted: v ? 'true' : undefined })}
              />
              <Label htmlFor="rc-deleted" className="text-xs">
                삭제 포함
              </Label>
            </span>
          </FilterBar>
        }
      >
        <DataTable
          columns={columns}
          data={items}
          getRowId={(r) => r.id}
          isLoading={list.isPending}
          emptyMessage="댓글이 없습니다."
          onRowClick={(r) => setOpenId(r.id)}
        />
      </ListShell>
      <CommentSheet
        comment={openId === undefined ? undefined : items.find((r) => r.id === openId)}
        onClose={() => setOpenId(undefined)}
      />
    </>
  );
}
