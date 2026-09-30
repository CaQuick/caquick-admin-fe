import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { type ColumnDef } from '@tanstack/react-table';

import { messageFor } from '@/shared/api';
import { formatCount } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { Card } from '@/shared/ui/card';
import { CursorPager } from '@/shared/ui/cursor-pager';
import { DataTable } from '@/shared/ui/data-table';
import { EntityPicker } from '@/shared/ui/entity-picker';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterField } from '@/shared/ui/filter-field';
import { IdFilterInput } from '@/shared/ui/id-filter-input';
import { Input } from '@/shared/ui/input';
import { PageHeader } from '@/shared/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { StatusPill } from '@/shared/ui/status-pill';

import { actorPickerQuery, auditLogsQueryOptions, storePickerQuery } from '../api/queries';
import { ActorLink, TargetLink } from '../components/audit-links';
import { type AuditRow, DiffDialog } from '../components/diff-dialog';
import {
  ACTIONS,
  type AuditSearch,
  type AuditSearchInput,
  TARGET_TYPES,
  actionMeta,
  hasAuditFilters,
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
    header: '작업',
    cell: ({ row }) => {
      const m = actionMeta(row.original.action);
      return <StatusPill tone={m.tone}>{m.label}</StatusPill>;
    },
  },
  {
    id: 'target',
    header: '대상',
    cell: ({ row }) => (
      <TargetLink targetType={row.original.targetType} targetId={row.original.targetId} />
    ),
  },
  {
    id: 'actor',
    header: '작업자',
    cell: ({ row }) => (
      <ActorLink
        accountId={row.original.actorAccountId}
        accountType={row.original.actorAccountType}
        label={row.original.actorLabel}
      />
    ),
  },
  {
    accessorKey: 'storeId',
    header: '매장',
    cell: ({ row }) =>
      row.original.storeId ? (
        <Link
          to="/stores/$storeId"
          params={{ storeId: row.original.storeId }}
          className="text-primary-soft-foreground hover:underline"
        >
          #{row.original.storeId}
        </Link>
      ) : (
        '—'
      ),
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
  const actorName =
    list.data?.items.find((r) => r.actorAccountId === search.actorId)?.actorLabel ?? undefined;
  return (
    <>
      <PageHeader
        title="감사 로그"
        meta={list.data ? `전체 ${formatCount(list.data.totalCount)}건` : undefined}
        description="판매자·관리자가 바꾼 내용을 모두 기록합니다. 기록은 추가만 되고 수정·삭제되지 않습니다."
      />
      <Card className="gap-0 py-0">
        <FilterBar
          hasActiveFilters={hasAuditFilters(search)}
          onReset={() => onSearchChange({ limit: search.limit })}
        >
          <FilterField label="대상">
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
            <IdFilterInput
              label="대상 번호"
              placeholder="번호"
              value={search.targetId}
              onCommit={(v) => patch({ targetId: v })}
            />
          </FilterField>
          <FilterField label="작업">
            <Select
              value={search.action ?? ALL}
              onValueChange={(v) =>
                patch({ action: v === ALL ? undefined : (v as AuditSearch['action']) })
              }
            >
              <SelectTrigger className="h-9 w-32" aria-label="작업">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>작업 전체</SelectItem>
                {ACTIONS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="작업자">
            <EntityPicker
              label="작업자"
              value={search.actorId}
              selectedLabel={actorName}
              onChange={(id) => patch({ actorId: id })}
              searchQuery={actorPickerQuery}
            />
          </FilterField>
          <FilterField label="매장">
            <EntityPicker
              label="매장"
              value={search.storeId}
              onChange={(id) => patch({ storeId: id })}
              searchQuery={storePickerQuery}
            />
          </FilterField>
          <FilterField label="기간">
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
            emptyMessage="조건에 맞는 기록이 없습니다."
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
