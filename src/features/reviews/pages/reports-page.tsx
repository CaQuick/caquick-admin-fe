import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { type ColumnDef } from '@tanstack/react-table';

import { type AdminReviewReportsQuery } from '@/graphql/generated/graphql';
import { messageFor } from '@/shared/api';
import { formatCount } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { DataTable } from '@/shared/ui/data-table';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterField } from '@/shared/ui/filter-field';
import { PageHeader } from '@/shared/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { StatusPill } from '@/shared/ui/status-pill';

import { reportsQueryOptions } from '../api/queries';
import { ListShell } from '../components/list-shell';
import { Reporter } from '../components/reporter';
import {
  REPORT_REASON,
  REPORT_STATUS,
  type ReportsSearch,
  type ReportsSearchInput,
  TARGET_TYPE,
  toReportListInput,
} from '../meta';

type Row = AdminReviewReportsQuery['adminReviewReports']['items'][number];
const ALL = '__all__';

const columns: ColumnDef<Row, unknown>[] = [
  {
    accessorKey: 'contentSnapshot',
    header: '신고 대상',
    cell: ({ row }) => (
      <span className="flex max-w-96 flex-col">
        <span className="text-[11.5px] text-muted-foreground">
          {TARGET_TYPE[row.original.targetType]} #{row.original.targetId}
        </span>
        <Link
          to="/reports/$reportId"
          params={{ reportId: row.original.id }}
          className="truncate font-medium text-primary-soft-foreground hover:underline"
        >
          {row.original.contentSnapshot ?? '(신고 당시 내용 없음)'}
        </Link>
      </span>
    ),
  },
  {
    accessorKey: 'reason',
    header: '사유',
    cell: ({ row }) => REPORT_REASON[row.original.reason] ?? row.original.reason,
  },
  {
    accessorKey: 'status',
    header: '상태',
    cell: ({ row }) => {
      const m = REPORT_STATUS[row.original.status] ?? {
        label: row.original.status,
        tone: 'neutral' as const,
      };
      return <StatusPill tone={m.tone}>{m.label}</StatusPill>;
    },
  },
  {
    accessorKey: 'reporterAccountId',
    header: '신고자',
    cell: ({ row }) => (
      <Reporter
        accountId={row.original.reporterAccountId}
        nickname={row.original.reporterNickname}
        withdrawn={row.original.reporterWithdrawn}
      />
    ),
  },
  {
    accessorKey: 'createdAt',
    header: '접수일',
    cell: ({ row }) => formatKst(row.original.createdAt),
  },
];

export function ReportsPage({
  search,
  onSearchChange,
}: {
  search: ReportsSearch;
  onSearchChange: (next: ReportsSearchInput) => void;
}) {
  const list = useQuery(reportsQueryOptions(toReportListInput(search)));
  const patch = (p: Partial<ReportsSearchInput>) =>
    onSearchChange({ ...search, ...p, cursor: undefined });
  const statusValue = search.all === 'true' ? ALL : (search.status ?? 'PENDING');
  return (
    <>
      <PageHeader
        title="신고"
        meta={list.data ? `${formatCount(list.data.totalCount)}건` : undefined}
        description="기본은 대기 중인 신고만 보입니다."
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
            hasActiveFilters={
              search.all !== undefined ||
              search.status !== undefined ||
              search.targetType !== undefined
            }
            onReset={() => onSearchChange({ limit: search.limit })}
          >
            <FilterField label="상태">
              <Select
                value={statusValue}
                onValueChange={(v) =>
                  patch(
                    v === ALL
                      ? { all: 'true', status: undefined }
                      : { all: undefined, status: v as ReportsSearch['status'] },
                  )
                }
              >
                <SelectTrigger className="h-9 w-44" aria-label="상태">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>상태 전체</SelectItem>
                  {Object.entries(REPORT_STATUS).map(([v, m]) => (
                    <SelectItem key={v} value={v}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="대상">
              <Select
                value={search.targetType ?? ALL}
                onValueChange={(v) =>
                  patch({ targetType: v === ALL ? undefined : (v as ReportsSearch['targetType']) })
                }
              >
                <SelectTrigger className="h-9 w-32" aria-label="대상 유형">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>대상 전체</SelectItem>
                  <SelectItem value="REVIEW">리뷰</SelectItem>
                  <SelectItem value="REVIEW_COMMENT">댓글</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
          </FilterBar>
        }
      >
        <DataTable
          columns={columns}
          data={list.data?.items ?? []}
          getRowId={(r) => r.id}
          isLoading={list.isPending}
          emptyMessage="신고가 없습니다."
        />
      </ListShell>
    </>
  );
}
