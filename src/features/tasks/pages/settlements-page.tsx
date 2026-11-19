import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';

import { messageFor } from '@/shared/api';
import { formatCount, formatKrw } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { CursorPager } from '@/shared/ui/cursor-pager';
import { DataTable } from '@/shared/ui/data-table';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterField } from '@/shared/ui/filter-field';
import { Input } from '@/shared/ui/input';
import { StatusPill } from '@/shared/ui/status-pill';

import { type SettlementRow, settlementsQueryOptions } from '../api/queries';
import { SettlementSheet, StoreAccountLink } from '../components/settlement-sheet';
import { TasksHeader } from '../components/task-counts';
import { nextTask } from '../meta';
import {
  type SettlementsSearch,
  type SettlementsSearchInput,
  toSettlementListInput,
} from '../search';

interface Props {
  search: SettlementsSearch;
  onSearchChange: (next: SettlementsSearchInput) => void;
}

export function SettlementsTasksPage({ search, onSearchChange }: Props) {
  const { settlementId, ...listSearch } = search;
  const open = (id: string | undefined) => onSearchChange({ ...listSearch, settlementId: id });
  const list = useQuery(settlementsQueryOptions(toSettlementListInput(search)));

  const columns: ColumnDef<SettlementRow, unknown>[] = [
    {
      id: 'period',
      header: '정산 기간',
      cell: ({ row }) => `${row.original.periodStart} ~ ${row.original.periodEnd}`,
    },
    { id: 'store', header: '매장', cell: ({ row }) => row.original.storeName },
    {
      id: 'orders',
      header: '주문',
      meta: { align: 'right' },
      cell: ({ row }) => `${formatCount(row.original.orderCount)}건`,
    },
    {
      id: 'commission',
      header: '수수료',
      meta: { align: 'right' },
      cell: ({ row }) => formatKrw(row.original.commissionAmount),
    },
    {
      id: 'payout',
      header: '송금액',
      meta: { align: 'right' },
      cell: ({ row }) => (
        <span className="font-semibold">{formatKrw(row.original.payoutAmount)}</span>
      ),
    },
    {
      id: 'account',
      header: '정산 계좌',
      cell: ({ row }) =>
        row.original.accountRegistered ? (
          <StatusPill tone="positive">등록</StatusPill>
        ) : (
          <span className="flex items-center gap-1.5">
            <StatusPill tone="negative">없음</StatusPill>
            <span onClick={(e) => e.stopPropagation()}>
              <StoreAccountLink storeId={row.original.storeId} />
            </span>
          </span>
        ),
    },
    { id: 'createdAt', header: '생성', cell: ({ row }) => formatKst(row.original.createdAt) },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          size="xs"
          disabled={!row.original.accountRegistered}
          onClick={(e) => {
            e.stopPropagation();
            open(row.original.id);
          }}
        >
          송금 처리
        </Button>
      ),
    },
  ];

  return (
    <>
      <TasksHeader />
      <Card className="gap-0 py-0">
        <FilterBar
          hasActiveFilters={search.periodStart !== undefined}
          onReset={() => onSearchChange({ limit: search.limit })}
        >
          <FilterField label="정산 기간 시작">
            <Input
              type="date"
              aria-label="정산 기간 시작(월요일)"
              className="h-9 w-36"
              value={search.periodStart ?? ''}
              onChange={(e) =>
                onSearchChange({
                  ...listSearch,
                  periodStart: e.target.value || undefined,
                  cursor: undefined,
                })
              }
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
            emptyMessage="송금을 기다리는 정산이 없습니다."
            onRowClick={(r) => open(r.id)}
          />
        )}
        {list.data && (
          <CursorPager
            page={list.data}
            search={listSearch}
            isFetching={list.isFetching}
            onCursorChange={(cursor) => onSearchChange({ ...listSearch, cursor })}
          />
        )}
      </Card>
      <SettlementSheet
        settlementId={settlementId}
        next={(id) =>
          // 계좌가 없는 정산은 송금 처리할 수 없어 다음 건으로 고르지 않는다
          nextTask(
            list.data?.items.filter((s) => s.accountRegistered).map((s) => s.id),
            list.data?.totalCount,
            id,
          )
        }
        onOpen={open}
      />
    </>
  );
}
