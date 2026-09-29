import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { type AdminTagsQuery } from '@/graphql/generated/graphql';
import { messageFor } from '@/shared/api';
import { formatCount } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { DEFAULT_LIMIT } from '@/shared/lib/list-search';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { CursorPager } from '@/shared/ui/cursor-pager';
import { DataTable } from '@/shared/ui/data-table';
import { FilterBar } from '@/shared/ui/filter-bar';
import { PageHeader } from '@/shared/ui/page-header';

import { tagMutations, tagsQueryOptions } from '../api/queries';
import { TagDialog } from '../components/tag-dialog';
import { type TagsSearch, type TagsSearchInput } from '../schemas';

type TagRow = AdminTagsQuery['adminTags']['items'][number];

interface Props {
  search: TagsSearch;
  onSearchChange: (next: TagsSearchInput) => void;
}

export function TagsPage({ search, onSearchChange }: Props) {
  const qc = useQueryClient();
  const list = useQuery(
    tagsQueryOptions({
      limit: search.limit ?? DEFAULT_LIMIT,
      cursor: search.cursor ?? null,
      keyword: search.q ?? null,
    }),
  );

  const columns: ColumnDef<TagRow, unknown>[] = [
    {
      accessorKey: 'name',
      header: '이름',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'productCount',
      header: '상품',
      meta: { align: 'right' },
      cell: ({ row }) => formatCount(row.original.productCount),
    },
    {
      accessorKey: 'updatedAt',
      header: '수정',
      cell: ({ row }) => formatKst(row.original.updatedAt),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <TagDialog
            tag={row.original}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={`${row.original.name} 수정`}
              >
                <PencilIcon className="size-4" />
              </Button>
            }
          />
          <ConfirmDialog
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-negative-foreground"
                aria-label={`${row.original.name} 삭제`}
              >
                <Trash2Icon className="size-4" />
              </Button>
            }
            title={`${row.original.name} 태그를 삭제할까요?`}
            description={`상품 ${formatCount(row.original.productCount)}개와의 연결이 끊깁니다.`}
            confirmLabel="삭제"
            destructive
            onConfirm={async () => {
              try {
                await tagMutations.remove(qc, row.original.id);
                toast.success(`${row.original.name} 태그를 삭제했습니다.`);
              } catch (e) {
                toast.error(messageFor(e));
                throw e;
              }
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="태그"
        meta={list.data ? `전체 ${formatCount(list.data.totalCount)}개` : undefined}
        actions={
          <TagDialog
            trigger={
              <Button>
                <PlusIcon className="size-4" /> 태그 추가
              </Button>
            }
          />
        }
      />
      <Card className="gap-0 py-0">
        <FilterBar
          keyword={search.q ?? ''}
          keywordPlaceholder="태그 이름"
          onKeywordSubmit={(q) =>
            onSearchChange({ ...search, q: q || undefined, cursor: undefined })
          }
          hasActiveFilters={search.q !== undefined}
          onReset={() => onSearchChange({ limit: search.limit })}
        />
        {list.isError ? (
          <p role="alert" className="px-4 py-8 text-center text-sm text-negative-foreground">
            {messageFor(list.error)}
          </p>
        ) : (
          <DataTable
            columns={columns}
            data={list.data?.items ?? []}
            getRowId={(r) => r.id}
            isLoading={list.isPending}
            emptyMessage="태그가 없습니다."
          />
        )}
        {list.data && (
          <CursorPager
            page={list.data}
            search={search}
            isFetching={list.isFetching}
            onCursorChange={(cursor) => onSearchChange({ ...search, cursor })}
          />
        )}
      </Card>
    </>
  );
}
