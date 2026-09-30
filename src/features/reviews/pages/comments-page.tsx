import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { type ColumnDef } from '@tanstack/react-table';

import { type AdminReviewCommentsQuery } from '@/graphql/generated/graphql';
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

import { commentsQueryOptions } from '../api/queries';
import { DeleteWithReason } from '../components/delete-with-reason';
import { ListShell } from '../components/list-shell';
import { type CommentsSearch, type CommentsSearchInput, toCommentListInput } from '../meta';

type Row = AdminReviewCommentsQuery['adminReviewComments']['items'][number];

const columns: ColumnDef<Row, unknown>[] = [
  {
    accessorKey: 'content',
    header: '내용',
    cell: ({ row }) => (
      <span className="flex max-w-96 items-center gap-2">
        {row.original.deleted && <StatusPill tone="negative">삭제됨</StatusPill>}
        <span className="truncate">{row.original.content}</span>
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
    accessorKey: 'reviewId',
    header: '리뷰',
    cell: ({ row }) => (
      <Link
        to="/reviews"
        search={{ q: undefined }}
        className="text-muted-foreground hover:underline"
      >
        #{row.original.reviewId}
      </Link>
    ),
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
      <div className="flex justify-end">
        <DeleteWithReason kind="comment" id={row.original.id} deleted={row.original.deleted} />
      </div>
    ),
  },
];

export function CommentsPage({
  search,
  onSearchChange,
}: {
  search: CommentsSearch;
  onSearchChange: (next: CommentsSearchInput) => void;
}) {
  const list = useQuery(commentsQueryOptions(toCommentListInput(search)));
  const patch = (p: Partial<CommentsSearchInput>) =>
    onSearchChange({ ...search, ...p, cursor: undefined });
  return (
    <>
      <PageHeader
        title="리뷰 댓글"
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
            hasActiveFilters={[search.reviewId, search.accountId, search.deleted].some(
              (v) => v !== undefined,
            )}
            onReset={() => onSearchChange({ limit: search.limit })}
          >
            <IdFilterInput
              label="리뷰 ID"
              value={search.reviewId}
              onCommit={(v) => patch({ reviewId: v })}
            />
            <IdFilterInput
              label="작성자 계정 ID"
              placeholder="계정 ID"
              value={search.accountId}
              onCommit={(v) => patch({ accountId: v })}
            />
            <span className="flex items-center gap-1.5">
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
          data={list.data?.items ?? []}
          getRowId={(r) => r.id}
          isLoading={list.isPending}
          emptyMessage="댓글이 없습니다."
        />
      </ListShell>
    </>
  );
}
