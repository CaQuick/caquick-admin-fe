import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { type ColumnDef } from '@tanstack/react-table';
import { CalendarRangeIcon } from 'lucide-react';

import { type AdminSettlementsQuery } from '@/graphql/generated/graphql';
import { messageFor } from '@/shared/api';
import { formatCount, formatKrw } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { CursorPager } from '@/shared/ui/cursor-pager';
import { DataTable } from '@/shared/ui/data-table';
import { EntityPicker } from '@/shared/ui/entity-picker';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterField } from '@/shared/ui/filter-field';
import { Input } from '@/shared/ui/input';
import { PageHeader } from '@/shared/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { StatusPill } from '@/shared/ui/status-pill';

import { settlementsListQueryOptions, storePickerQuery } from '../api/queries';
import {
  type SettlementsSearch,
  type SettlementsSearchInput,
  hasSettlementFilters,
  mondayOf,
  toSettlementListInput,
} from '../search';
import { SETTLEMENT_STATUS_VALUES, settlementStatusMeta } from '../status';

type Row = AdminSettlementsQuery['adminSettlements']['items'][number];

const ALL = '__all__';
const linkClass = 'text-primary-soft-foreground hover:underline';
const money = (
  key: 'settlementBaseAmount' | 'commissionAmount' | 'payoutAmount',
  header: string,
): ColumnDef<Row, unknown> => ({
  accessorKey: key,
  header,
  meta: { align: 'right' },
  cell: ({ row }) => formatKrw(row.original[key]),
});

const columns: ColumnDef<Row, unknown>[] = [
  {
    accessorKey: 'periodStart',
    header: '정산 기간',
    cell: ({ row }) => (
      <Link
        to="/settlements/$settlementId"
        params={{ settlementId: row.original.id }}
        className={`font-medium tabular-nums ${linkClass}`}
      >
        {row.original.periodStart} ~ {row.original.periodEnd.slice(5)}
      </Link>
    ),
  },
  {
    accessorKey: 'storeName',
    header: '매장',
    cell: ({ row }) => (
      <Link to="/stores/$storeId" params={{ storeId: row.original.storeId }} className={linkClass}>
        {row.original.storeName}
      </Link>
    ),
  },
  {
    accessorKey: 'orderCount',
    header: '주문',
    meta: { align: 'right' },
    cell: ({ row }) => `${formatCount(row.original.orderCount)}건`,
  },
  money('settlementBaseAmount', '기준액'),
  money('commissionAmount', '수수료'),
  money('payoutAmount', '송금액'),
  {
    accessorKey: 'status',
    header: '상태',
    cell: ({ row }) => {
      const m = settlementStatusMeta(row.original.status);
      return <StatusPill tone={m.tone}>{m.label}</StatusPill>;
    },
  },
  {
    accessorKey: 'accountRegistered',
    header: '정산 계좌',
    cell: ({ row }) =>
      row.original.accountRegistered ? '등록' : <StatusPill tone="caution">미등록</StatusPill>,
  },
  {
    accessorKey: 'paidAt',
    header: '송금 완료',
    cell: ({ row }) => (row.original.paidAt ? formatKst(row.original.paidAt) : '—'),
  },
];

interface Props {
  search: SettlementsSearch;
  onSearchChange: (next: SettlementsSearchInput) => void;
}

export function SettlementsListPage({ search, onSearchChange }: Props) {
  const list = useQuery(settlementsListQueryOptions(toSettlementListInput(search)));
  const patch = (p: Partial<SettlementsSearchInput>) =>
    onSearchChange({ ...search, ...p, cursor: undefined });
  const storeName = list.data?.items.find((r) => r.storeId === search.storeId)?.storeName;
  return (
    <>
      <PageHeader
        title="주간 정산"
        meta={list.data ? `전체 ${formatCount(list.data.totalCount)}건` : undefined}
        description="매주 월요일에 지난주(월~일) 정산이 확정된 주문을 매장별로 묶습니다. 은행 앱에서 송금한 뒤 송금 완료로 처리하세요."
        actions={
          <Button asChild variant="outline">
            <Link to="/settlements/monthly">
              <CalendarRangeIcon className="size-4" /> 월 수수료
            </Link>
          </Button>
        }
      />
      <Card className="gap-0 py-0">
        <FilterBar
          hasActiveFilters={hasSettlementFilters(search)}
          onReset={() => onSearchChange({ limit: search.limit })}
        >
          <FilterField label="상태">
            <Select
              value={search.status ?? ALL}
              onValueChange={(v) =>
                patch({ status: v === ALL ? undefined : (v as SettlementsSearch['status']) })
              }
            >
              <SelectTrigger className="h-9 w-32" aria-label="송금 상태">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>전체</SelectItem>
                {SETTLEMENT_STATUS_VALUES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {settlementStatusMeta(v).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="매장">
            <EntityPicker
              label="매장"
              value={search.storeId}
              selectedLabel={storeName}
              onChange={(id) => patch({ storeId: id })}
              searchQuery={storePickerQuery}
            />
          </FilterField>
          <FilterField label="정산 주">
            <Input
              type="date"
              aria-label="정산 주에 속한 날짜"
              title="고른 날짜가 속한 주(월요일 시작)로 찾습니다"
              className="h-9 w-36"
              value={search.periodStart ?? ''}
              onChange={(e) => patch({ periodStart: mondayOf(e.target.value) })}
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
            emptyMessage="조건에 맞는 정산이 없습니다."
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
