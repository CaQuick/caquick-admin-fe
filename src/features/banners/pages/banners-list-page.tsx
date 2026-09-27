import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { type ColumnDef } from '@tanstack/react-table';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { type AdminBannersQuery } from '@/graphql/generated/graphql';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { StatusPill } from '@/shared/ui/status-pill';

import { bannersListQueryOptions, deleteBanner } from '../api/queries';
import { type BannersSearch, type BannersSearchInput, LINK_TYPES, PLACEMENTS } from '../schema';

type BannerRow = AdminBannersQuery['adminBanners']['items'][number];
const ALL = '__all__';
const placementLabel = (v: string) => PLACEMENTS.find((p) => p.value === v)?.label ?? v;
const linkLabel = (v: string) => LINK_TYPES.find((l) => l.value === v)?.label ?? v;

interface Props {
  search: BannersSearch;
  onSearchChange: (next: BannersSearchInput) => void;
}

export function BannersListPage({ search, onSearchChange }: Props) {
  const qc = useQueryClient();
  const list = useQuery(
    bannersListQueryOptions({
      limit: search.limit ?? DEFAULT_LIMIT,
      cursor: search.cursor ?? null,
      placement: search.placement ?? null,
      isActive: search.active === undefined ? null : search.active === 'true',
    }),
  );
  const patch = (p: Partial<BannersSearchInput>) =>
    onSearchChange({ ...search, ...p, cursor: undefined });

  const columns: ColumnDef<BannerRow, unknown>[] = [
    {
      accessorKey: 'title',
      header: '배너',
      cell: ({ row }) => (
        <span className="flex items-center gap-2.5">
          <img
            src={row.original.imageUrl}
            alt=""
            className="h-9 w-[108px] shrink-0 rounded-md border bg-surface-tint object-cover"
          />
          <Link
            to="/banners/$bannerId"
            params={{ bannerId: row.original.id }}
            className="font-medium text-primary-soft-foreground hover:underline"
          >
            {row.original.title ?? `(제목 없음) #${row.original.id}`}
          </Link>
        </span>
      ),
    },
    {
      accessorKey: 'placement',
      header: '배치',
      cell: ({ row }) => placementLabel(row.original.placement),
    },
    {
      accessorKey: 'isActive',
      header: '상태',
      cell: ({ row }) => (
        <StatusPill tone={row.original.isActive ? 'positive' : 'neutral'}>
          {row.original.isActive ? '활성' : '비활성'}
        </StatusPill>
      ),
    },
    {
      accessorKey: 'linkType',
      header: '링크',
      cell: ({ row }) => linkLabel(row.original.linkType),
    },
    {
      id: 'period',
      header: '노출 기간',
      cell: ({ row }) =>
        `${row.original.startsAt ? formatKst(row.original.startsAt) : '제한 없음'} ~ ${row.original.endsAt ? formatKst(row.original.endsAt) : '제한 없음'}`,
    },
    { accessorKey: 'sortOrder', header: '순서', meta: { align: 'right' } },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <ConfirmDialog
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-negative-foreground"
                aria-label={`${row.original.title ?? row.original.id} 삭제`}
              >
                <Trash2Icon className="size-4" />
              </Button>
            }
            title="배너를 삭제할까요?"
            description="구매자 화면에서 바로 사라집니다."
            confirmLabel="삭제"
            destructive
            onConfirm={async () => {
              try {
                await deleteBanner(qc, row.original.id);
                toast.success('배너를 삭제했습니다.');
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
        title="배너"
        meta={list.data ? `전체 ${formatCount(list.data.totalCount)}개` : undefined}
        actions={
          <Button asChild>
            <Link to="/banners/new">
              <PlusIcon className="size-4" /> 새 배너
            </Link>
          </Button>
        }
      />
      <Card className="gap-0 py-0">
        <FilterBar
          hasActiveFilters={search.placement !== undefined || search.active !== undefined}
          onReset={() => onSearchChange({ limit: search.limit })}
        >
          <Select
            value={search.placement ?? ALL}
            onValueChange={(v) =>
              patch({ placement: v === ALL ? undefined : (v as BannersSearch['placement']) })
            }
          >
            <SelectTrigger className="h-9 w-36" aria-label="배치">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>배치 전체</SelectItem>
              {PLACEMENTS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={search.active ?? ALL}
            onValueChange={(v) =>
              patch({ active: v === ALL ? undefined : (v as 'true' | 'false') })
            }
          >
            <SelectTrigger className="h-9 w-32" aria-label="활성 여부">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>전체</SelectItem>
              <SelectItem value="true">활성</SelectItem>
              <SelectItem value="false">비활성</SelectItem>
            </SelectContent>
          </Select>
        </FilterBar>
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
            emptyMessage="배너가 없습니다."
          />
        )}
        {list.data && (
          <CursorPager
            totalCount={list.data.totalCount}
            shown={list.data.items.length}
            hasMore={list.data.hasMore}
            atStart={!search.cursor}
            isFetching={list.isFetching}
            onNext={() =>
              list.data?.nextCursor && onSearchChange({ ...search, cursor: list.data.nextCursor })
            }
            onReset={() => onSearchChange({ ...search, cursor: undefined })}
          />
        )}
      </Card>
    </>
  );
}
