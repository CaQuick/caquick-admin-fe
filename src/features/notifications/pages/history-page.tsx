import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { type ColumnDef } from '@tanstack/react-table';
import { SendIcon } from 'lucide-react';

import { messageFor } from '@/shared/api';
import { formatCount } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { CursorPager } from '@/shared/ui/cursor-pager';
import { DataTable } from '@/shared/ui/data-table';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterField } from '@/shared/ui/filter-field';
import { PageHeader } from '@/shared/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { StatusPill } from '@/shared/ui/status-pill';

import { type Broadcast, broadcastQueryOptions, broadcastsQueryOptions } from '../api/queries';
import { BroadcastDetailSheet } from '../components/broadcast-detail-sheet';
import {
  BROADCAST_STATUS,
  NOTIFICATION_TYPES,
  type NotificationsSearch,
  type NotificationsSearchInput,
  TARGET_KINDS,
  actorText,
  targetSummary,
  toBroadcastListInput,
  typeLabel,
} from '../meta';

const ALL = '__all__';

interface Props {
  search: NotificationsSearch;
  onSearchChange: (next: NotificationsSearchInput) => void;
}

export function NotificationHistoryPage({ search, onSearchChange }: Props) {
  const { broadcastId, ...listSearch } = search;
  const list = useQuery(broadcastsQueryOptions(toBroadcastListInput(search)));
  const patch = (p: Partial<NotificationsSearchInput>) =>
    onSearchChange({ ...listSearch, ...p, cursor: undefined });
  const open = (id: string | undefined) => onSearchChange({ ...listSearch, broadcastId: id });
  // 공유된 주소의 이력이 지금 페이지·필터에 없어도 열리도록 단건으로 읽고, 목록에 있으면 그 행을 먼저 보인다
  const listed =
    broadcastId === undefined ? undefined : list.data?.items.find((b) => b.id === broadcastId);
  const detail = useQuery({
    ...broadcastQueryOptions(broadcastId ?? ''),
    enabled: broadcastId !== undefined,
    placeholderData: listed,
  });

  const columns: ColumnDef<Broadcast, unknown>[] = [
    {
      id: 'requestedAt',
      header: '요청 시각',
      cell: ({ row }) => formatKst(row.original.requestedAt, true),
    },
    { id: 'type', header: '유형', cell: ({ row }) => typeLabel(row.original.type) },
    {
      id: 'title',
      header: '제목',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            open(row.original.id);
          }}
          className="max-w-72 truncate text-left font-medium text-primary-soft-foreground hover:underline"
        >
          {row.original.title}
        </button>
      ),
    },
    {
      id: 'target',
      header: '대상',
      cell: ({ row }) => targetSummary(row.original.targetKind, row.original.targetCount),
    },
    {
      id: 'delivered',
      header: '저장 / 대상',
      meta: { align: 'right' },
      cell: ({ row }) =>
        `${formatCount(row.original.deliveredCount)} / ${formatCount(row.original.targetCount)}명`,
    },
    {
      id: 'status',
      header: '상태',
      cell: ({ row }) => {
        const s = BROADCAST_STATUS[row.original.status];
        return <StatusPill tone={s.tone}>{s.label}</StatusPill>;
      },
    },
    {
      id: 'actor',
      header: '보낸 사람',
      cell: ({ row }) => actorText(row.original.actorLabel, row.original.actorAccountId),
    },
  ];

  return (
    <>
      <PageHeader
        title="알림"
        description="보낸 알림과 구매자 알림함에 저장된 진행 상황을 확인합니다. 제목을 누르면 본문과 대상 계정을 볼 수 있습니다."
        meta={list.data ? `전체 ${formatCount(list.data.totalCount)}건` : undefined}
        actions={
          <Button asChild>
            <Link to="/notifications/send">
              <SendIcon className="size-4" /> 새 알림 보내기
            </Link>
          </Button>
        }
      />
      <Card className="gap-0 py-0">
        <FilterBar
          hasActiveFilters={search.type !== undefined || search.targetKind !== undefined}
          onReset={() => onSearchChange({ limit: search.limit })}
        >
          <FilterField label="유형">
            <Select
              value={search.type ?? ALL}
              onValueChange={(v) =>
                patch({ type: v === ALL ? undefined : (v as NotificationsSearch['type']) })
              }
            >
              <SelectTrigger className="h-9 w-32" aria-label="유형">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>전체</SelectItem>
                {NOTIFICATION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="대상">
            <Select
              value={search.targetKind ?? ALL}
              onValueChange={(v) =>
                patch({
                  targetKind: v === ALL ? undefined : (v as NotificationsSearch['targetKind']),
                })
              }
            >
              <SelectTrigger className="h-9 w-36" aria-label="대상">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>전체</SelectItem>
                {TARGET_KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
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
            emptyMessage="보낸 알림이 없습니다."
            onRowClick={(r) => open(r.id)}
          />
        )}
        {list.data && (
          <CursorPager
            page={list.data}
            // 상세 시트를 여닫아도 지나온 페이지를 잃지 않도록 목록 조건에서 뺀다
            search={listSearch}
            isFetching={list.isFetching}
            onCursorChange={(cursor) => onSearchChange({ ...listSearch, cursor })}
          />
        )}
      </Card>
      <BroadcastDetailSheet
        broadcastId={broadcastId}
        broadcast={detail.data ?? null}
        isLoading={detail.isPending}
        error={detail.isError ? detail.error : null}
        onClose={() => open(undefined)}
      />
    </>
  );
}
