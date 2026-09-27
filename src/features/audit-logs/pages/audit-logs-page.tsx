import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';

import { messageFor } from '@/shared/api';
import { formatCount } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { Card } from '@/shared/ui/card';
import { CursorPager } from '@/shared/ui/cursor-pager';
import { DataTable } from '@/shared/ui/data-table';
import { FilterBar } from '@/shared/ui/filter-bar';
import { Input } from '@/shared/ui/input';
import { PageHeader } from '@/shared/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { StatusPill } from '@/shared/ui/status-pill';

import { auditLogsQueryOptions } from '../api/queries';
import { type AuditRow, DiffDialog } from '../components/diff-dialog';
import {
  ACTIONS,
  type AuditSearch,
  type AuditSearchInput,
  TARGET_TYPES,
  actionMeta,
  hasAuditFilters,
  targetLabel,
  toAuditListInput,
} from '../meta';

const ALL = '__all__';

const columns: ColumnDef<AuditRow, unknown>[] = [
  {
    accessorKey: 'createdAt',
    header: '시각',
    cell: ({ row }) => (
      <span className="tabular-nums">{formatKst(row.original.createdAt, true)}</span>
    ),
  },
  {
    accessorKey: 'action',
    header: '액션',
    cell: ({ row }) => {
      const m = actionMeta(row.original.action);
      return <StatusPill tone={m.tone}>{m.label}</StatusPill>;
    },
  },
  {
    id: 'target',
    header: '대상',
    cell: ({ row }) => `${targetLabel(row.original.targetType)} #${row.original.targetId}`,
  },
  {
    id: 'actor',
    header: '행위자',
    cell: ({ row }) =>
      `#${row.original.actorAccountId} (${row.original.actorAccountType ?? '삭제됨'})`,
  },
  {
    accessorKey: 'storeId',
    header: '매장',
    cell: ({ row }) => (row.original.storeId ? `#${row.original.storeId}` : '—'),
  },
  { accessorKey: 'ipAddress', header: 'IP', cell: ({ row }) => row.original.ipAddress ?? '—' },
  {
    id: 'detail',
    header: '',
    cell: ({ row }) => (
      <div className="flex justify-end">
        <DiffDialog log={row.original} />
      </div>
    ),
  },
];

function IdInput({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string | undefined;
  onCommit: (v: string | undefined) => void;
}) {
  return (
    <Input
      aria-label={label}
      placeholder={label}
      className="h-9 w-24"
      key={value ?? ''}
      defaultValue={value ?? ''}
      onBlur={(e) => onCommit(e.target.value.trim() || undefined)}
    />
  );
}

export function AuditLogsPage({
  search,
  onSearchChange,
}: {
  search: AuditSearch;
  onSearchChange: (next: AuditSearchInput) => void;
}) {
  const list = useQuery(auditLogsQueryOptions(toAuditListInput(search)));
  const patch = (p: Partial<AuditSearchInput>) =>
    onSearchChange({ ...search, ...p, cursor: undefined });
  return (
    <>
      <PageHeader
        title="감사 로그"
        meta={list.data ? `전체 ${formatCount(list.data.totalCount)}건` : undefined}
        description="판매자·관리자의 모든 변경 기록. 추가만 되고 수정·삭제되지 않습니다."
      />
      <Card className="gap-0 py-0">
        <FilterBar
          hasActiveFilters={hasAuditFilters(search)}
          onReset={() => onSearchChange({ limit: search.limit })}
        >
          <Select
            value={search.targetType ?? ALL}
            onValueChange={(v) =>
              patch({ targetType: v === ALL ? undefined : (v as AuditSearch['targetType']) })
            }
          >
            <SelectTrigger className="h-9 w-36" aria-label="대상 유형">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>대상 전체</SelectItem>
              {TARGET_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <IdInput
            label="대상 ID"
            value={search.targetId}
            onCommit={(v) => patch({ targetId: v })}
          />
          <Select
            value={search.action ?? ALL}
            onValueChange={(v) =>
              patch({ action: v === ALL ? undefined : (v as AuditSearch['action']) })
            }
          >
            <SelectTrigger className="h-9 w-32" aria-label="액션">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>액션 전체</SelectItem>
              {ACTIONS.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <IdInput
            label="행위자 ID"
            value={search.actorId}
            onCommit={(v) => patch({ actorId: v })}
          />
          <IdInput label="매장 ID" value={search.storeId} onCommit={(v) => patch({ storeId: v })} />
          <Input
            type="date"
            aria-label="시작일"
            className="h-9 w-36"
            value={search.from ?? ''}
            onChange={(e) => patch({ from: e.target.value || undefined })}
          />
          <span className="text-xs text-muted-foreground">~</span>
          <Input
            type="date"
            aria-label="종료일"
            className="h-9 w-36"
            value={search.to ?? ''}
            onChange={(e) => patch({ to: e.target.value || undefined })}
          />
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
            emptyMessage="조건에 맞는 기록이 없습니다."
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
