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
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import { type RefundRow, refundsQueryOptions, taskCountsQueryOptions } from '../api/queries';
import { RefundSheet } from '../components/refund-sheet';
import { TasksHeader } from '../components/task-counts';
import { REFUND_KINDS, nextTask, refundKindLabel } from '../meta';
import {
  REFUND_VIEWS,
  type RefundsSearch,
  type RefundsSearchInput,
  refundView,
  toRefundListInput,
} from '../search';

interface Props {
  search: RefundsSearch;
  onSearchChange: (next: RefundsSearchInput) => void;
}

export function RefundsTasksPage({ search, onSearchChange }: Props) {
  const view = refundView(search);
  const { refundId, ...listSearch } = search;
  const patch = (p: Partial<RefundsSearchInput>) =>
    onSearchChange({ ...listSearch, ...p, cursor: undefined });
  const open = (id: string | undefined) => onSearchChange({ ...listSearch, refundId: id });
  const counts = useQuery(taskCountsQueryOptions());
  const list = useQuery(refundsQueryOptions(toRefundListInput(search)));
  const viewCount = {
    AWAITING_TRANSFER: counts.data?.refundsAwaitingTransfer,
    AWAITING_ACCOUNT: counts.data?.refundsAwaitingAccount,
  };

  const columns: ColumnDef<RefundRow, unknown>[] = [
    {
      id: 'requestedAt',
      header: '요청 시각',
      cell: ({ row }) => formatKst(row.original.requestedAt),
    },
    {
      id: 'order',
      header: '주문',
      cell: ({ row }) => (
        <span className="flex flex-col">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              open(row.original.id);
            }}
            className="text-left font-medium text-primary-soft-foreground hover:underline"
          >
            {row.original.orderNumber}
          </button>
          <span className="max-w-56 truncate text-xs text-muted-foreground">
            {[row.original.storeName, row.original.productName].filter(Boolean).join(' · ')}
          </span>
        </span>
      ),
    },
    { id: 'kind', header: '종류', cell: ({ row }) => refundKindLabel(row.original.kind) },
    {
      id: 'amount',
      header: '금액',
      meta: { align: 'right' },
      cell: ({ row }) => formatKrw(row.original.amount),
    },
    view === 'AWAITING_TRANSFER'
      ? {
          id: 'account',
          header: '환불 계좌',
          cell: ({ row }) => {
            const r = row.original;
            return r.bank && r.accountNumberMasked
              ? `${r.bank.name} ${r.accountNumberMasked} (${r.accountHolder ?? '-'})`
              : '-';
          },
        }
      : {
          id: 'buyer',
          header: '주문자 연락처',
          cell: ({ row }) => `${row.original.buyerName} · ${row.original.buyerPhone}`,
        },
    {
      id: 'submittedAt',
      header: '계좌 입력',
      cell: ({ row }) =>
        row.original.accountSubmittedAt ? formatKst(row.original.accountSubmittedAt) : '-',
    },
  ];

  return (
    <>
      <TasksHeader />
      <Card className="gap-0 py-0">
        <FilterBar
          hasActiveFilters={search.kind !== undefined}
          onReset={() => onSearchChange({ status: search.status, limit: search.limit })}
        >
          <Tabs value={view} onValueChange={(v) => patch({ status: v as RefundsSearch['status'] })}>
            <TabsList>
              {REFUND_VIEWS.map((v) => (
                <TabsTrigger key={v.value} value={v.value}>
                  {v.label}
                  {viewCount[v.value] !== undefined && ' '}
                  {viewCount[v.value] !== undefined && (
                    <span className="text-xs tabular-nums">{formatCount(viewCount[v.value]!)}</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div role="group" aria-label="환불 종류" className="flex gap-1">
            {[{ value: undefined, label: '전체' }, ...REFUND_KINDS].map((k) => (
              <Button
                key={k.label}
                type="button"
                size="sm"
                variant={search.kind === k.value ? 'secondary' : 'ghost'}
                aria-pressed={search.kind === k.value}
                onClick={() => patch({ kind: k.value })}
              >
                {k.label}
              </Button>
            ))}
          </div>
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
            emptyMessage={
              view === 'AWAITING_TRANSFER'
                ? '송금을 기다리는 환불이 없습니다.'
                : '계좌 입력을 기다리는 환불이 없습니다.'
            }
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
      <RefundSheet
        refundId={refundId}
        next={(id) =>
          nextTask(
            list.data?.items.map((r) => r.id),
            list.data?.totalCount,
            id,
          )
        }
        onOpen={open}
      />
    </>
  );
}
