import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { type ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { toast } from 'sonner';

import { refundStatusMeta } from '@/features/orders';
import { messageFor } from '@/shared/api';
import { formatCount, formatKrw } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { CursorPager } from '@/shared/ui/cursor-pager';
import { DataTable } from '@/shared/ui/data-table';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterField } from '@/shared/ui/filter-field';
import { IdFilterInput } from '@/shared/ui/id-filter-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { StatusPill } from '@/shared/ui/status-pill';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import {
  type DepositRecord,
  type PendingPayment,
  depositRecordsQueryOptions,
  pendingPaymentsQueryOptions,
  taskCountsQueryOptions,
  taskMutations,
} from '../api/queries';
import { DepositDialog } from '../components/deposit-dialog';
import { DepositOrderSheet } from '../components/deposit-order-sheet';
import { LinkDepositDialog } from '../components/link-deposit-dialog';
import { TasksHeader } from '../components/task-counts';
import { toUnidentifiedDepositInput } from '../forms';
import { RECORD_KINDS, isPast, nextTask, pickupTone, recordKindLabel } from '../meta';
import {
  DEPOSIT_VIEWS,
  type DepositView,
  type DepositsSearch,
  type DepositsSearchInput,
  depositView,
  parseWon,
  toDepositRecordInput,
  toPendingPaymentInput,
} from '../search';

const ALL = '__all__';
const linkClass = 'text-primary-soft-foreground hover:underline';

interface Props {
  search: DepositsSearch;
  onSearchChange: (next: DepositsSearchInput) => void;
}

export function DepositsTasksPage({ search, onSearchChange }: Props) {
  const qc = useQueryClient();
  const view = depositView(search);
  const { orderId, ...listSearch } = search;
  const patch = (p: Partial<DepositsSearchInput>) =>
    onSearchChange({ ...listSearch, ...p, cursor: undefined });
  const openOrder = (id: string | undefined) => onSearchChange({ ...listSearch, orderId: id });
  const counts = useQuery(taskCountsQueryOptions());
  const payments = useQuery({
    ...pendingPaymentsQueryOptions(toPendingPaymentInput(search)),
    enabled: view !== 'records',
  });
  const [recordOpen, setRecordOpen] = useState(false);

  const viewCount: Record<DepositView, number | undefined> = {
    claimed: counts.data?.claimedPayments,
    pending: counts.data?.pendingPayments,
    records: undefined,
  };

  return (
    <>
      <TasksHeader
        actions={
          <Button variant="outline" onClick={() => setRecordOpen(true)}>
            주인 모를 입금 기록
          </Button>
        }
      />
      <Card className="gap-0 py-0">
        <FilterBar
          keyword={view === 'records' ? undefined : (search.depositorName ?? '')}
          keywordPlaceholder="입금자명"
          onKeywordSubmit={(v) => patch({ depositorName: v || undefined })}
          hasActiveFilters={(view === 'records'
            ? [search.kind]
            : [search.amount, search.depositorName]
          ).some((v) => v !== undefined)}
          onReset={() => onSearchChange({ view: search.view, limit: search.limit })}
        >
          <Tabs
            value={view}
            onValueChange={(v) => patch({ view: v as DepositView, kind: undefined })}
          >
            <TabsList>
              {DEPOSIT_VIEWS.map((v) => (
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
          {view === 'records' ? (
            <FilterField label="종류">
              <Select
                value={search.kind ?? ALL}
                onValueChange={(v) =>
                  patch({ kind: v === ALL ? undefined : (v as DepositsSearch['kind']) })
                }
              >
                <SelectTrigger className="h-9 w-28" aria-label="기록 종류">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>전체</SelectItem>
                  {RECORD_KINDS.map((k) => (
                    <SelectItem key={k.value} value={k.value}>
                      {k.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
          ) : (
            <FilterField label="금액">
              <IdFilterInput
                label="금액"
                placeholder="원"
                value={search.amount}
                validate={(v) => parseWon(v) !== null}
                invalidMessage="원 단위 금액으로 입력해 주세요."
                onCommit={(amount) =>
                  patch({ amount: amount === undefined ? undefined : String(parseWon(amount)) })
                }
              />
            </FilterField>
          )}
        </FilterBar>
        {view === 'records' ? (
          <RecordsList search={search} onSearchChange={onSearchChange} />
        ) : payments.isError ? (
          <p role="alert" className="px-4 py-8 text-center text-sm text-negative-foreground">
            {messageFor(payments.error)}
          </p>
        ) : (
          <>
            <PaymentsTable
              rows={payments.data?.items ?? []}
              isLoading={payments.isPending}
              view={view}
              onOpen={openOrder}
            />
            {payments.data && (
              <CursorPager
                page={payments.data}
                search={listSearch}
                isFetching={payments.isFetching}
                onCursorChange={(cursor) => onSearchChange({ ...listSearch, cursor })}
              />
            )}
          </>
        )}
      </Card>
      <DepositOrderSheet
        orderId={orderId}
        next={(id) =>
          view === 'records'
            ? null
            : nextTask(
                payments.data?.items.map((p) => p.orderId),
                payments.data?.totalCount,
                id,
              )
        }
        onOpen={openOrder}
      />
      <DepositDialog
        open={recordOpen}
        onOpenChange={setRecordOpen}
        title="주인 모를 입금 기록"
        description="주인을 찾지 못한 입금을 메모와 함께 종결 기록으로 남깁니다. 나중에 주인이 나타나면 입금 기록에서 주문에 연결해 돌려줄 수 있습니다."
        noteRequired
        submitLabel="종결 기록"
        onSubmit={async (v) => {
          await taskMutations.recordUnidentifiedDeposit(qc, toUnidentifiedDepositInput(v));
          toast.success('주인 모를 입금을 종결 기록으로 남겼습니다.');
        }}
      />
    </>
  );
}

function PaymentsTable({
  rows,
  isLoading,
  view,
  onOpen,
}: {
  rows: PendingPayment[];
  isLoading: boolean;
  view: DepositView;
  onOpen: (orderId: string) => void;
}) {
  const now = new Date();
  const columns: ColumnDef<PendingPayment, unknown>[] = [
    {
      id: 'order',
      header: '주문',
      cell: ({ row }) => (
        <span className="flex flex-col">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(row.original.orderId);
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
    {
      id: 'amount',
      header: '금액',
      meta: { align: 'right' },
      cell: ({ row }) => formatKrw(row.original.amount),
    },
    { id: 'depositor', header: '입금자명', cell: ({ row }) => row.original.depositorName },
    {
      id: 'buyer',
      header: '주문자',
      cell: ({ row }) => `${row.original.buyerName} · ${row.original.buyerPhone}`,
    },
    {
      id: 'claimed',
      header: '입금했어요',
      cell: ({ row }) =>
        row.original.buyerClaimedAt ? formatKst(row.original.buyerClaimedAt) : '-',
    },
    {
      id: 'expires',
      header: '입금 기한',
      cell: ({ row }) => (
        <span className="flex items-center gap-1.5">
          {formatKst(row.original.expiresAt)}
          {/* '입금했어요'를 누른 주문은 기한이 멈춰 자동 취소되지 않는다 */}
          {!row.original.buyerClaimedAt && isPast(row.original.expiresAt, now) && (
            <StatusPill tone="negative">지남</StatusPill>
          )}
        </span>
      ),
    },
    {
      id: 'pickup',
      header: '픽업',
      cell: ({ row }) => {
        const tone = pickupTone(row.original.pickupAt, now);
        return (
          <span className="flex items-center gap-1.5">
            {formatKst(row.original.pickupAt)}
            {tone && (
              <StatusPill tone={tone}>{tone === 'negative' ? '지남' : '3시간 미만'}</StatusPill>
            )}
          </span>
        );
      },
    },
  ];
  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(r) => r.orderId}
      isLoading={isLoading}
      emptyMessage={
        view === 'claimed'
          ? "'입금했어요'를 누른 주문이 없습니다."
          : '입금을 기다리는 주문이 없습니다.'
      }
      onRowClick={(r) => onOpen(r.orderId)}
    />
  );
}

function RecordsList({ search, onSearchChange }: Props) {
  const { orderId: _orderId, ...listSearch } = search;
  const records = useQuery(depositRecordsQueryOptions(toDepositRecordInput(search)));
  const [linking, setLinking] = useState<DepositRecord | null>(null);
  const columns: ColumnDef<DepositRecord, unknown>[] = [
    { id: 'createdAt', header: '기록 시각', cell: ({ row }) => formatKst(row.original.createdAt) },
    { id: 'kind', header: '종류', cell: ({ row }) => recordKindLabel(row.original.kind) },
    {
      id: 'amount',
      header: '입금액',
      meta: { align: 'right' },
      cell: ({ row }) => formatKrw(row.original.amount),
    },
    {
      id: 'depositor',
      header: '입금자명',
      cell: ({ row }) => (
        <span className="flex flex-col">
          {row.original.depositorName}
          {row.original.depositedAt && (
            <span className="text-xs text-muted-foreground">
              {formatKst(row.original.depositedAt)} 입금
            </span>
          )}
        </span>
      ),
    },
    {
      id: 'order',
      header: '주문',
      cell: ({ row }) =>
        row.original.orderId ? (
          <Link
            to="/orders/$orderId"
            params={{ orderId: row.original.orderId }}
            className={linkClass}
          >
            {row.original.orderNumber ?? `#${row.original.orderId}`}
          </Link>
        ) : (
          '-'
        ),
    },
    {
      id: 'refund',
      header: '환불',
      cell: ({ row }) => {
        const { refundId, refundStatus } = row.original;
        if (!refundId) return '-';
        return (
          <Link to="/tasks/refunds" search={{ refundId }} className={linkClass}>
            {refundStatus ? refundStatusMeta(refundStatus).label : `#${refundId}`}
          </Link>
        );
      },
    },
    {
      id: 'note',
      header: '메모',
      cell: ({ row }) => (
        <span className="line-clamp-2 max-w-60 whitespace-pre-line">
          {row.original.note ?? '-'}
        </span>
      ),
    },
    {
      id: 'recordedBy',
      header: '기록자',
      cell: ({ row }) => row.original.recordedByLabel ?? '-',
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) =>
        row.original.kind === 'UNIDENTIFIED' && (
          <Button size="xs" variant="outline" onClick={() => setLinking(row.original)}>
            주문에 연결
          </Button>
        ),
    },
  ];
  if (records.isError)
    return (
      <p role="alert" className="px-4 py-8 text-center text-sm text-negative-foreground">
        {messageFor(records.error)}
      </p>
    );
  return (
    <>
      <DataTable
        columns={columns}
        data={records.data?.items ?? []}
        getRowId={(r) => r.id}
        isLoading={records.isPending}
        emptyMessage="입금 기록이 없습니다."
      />
      {records.data && (
        <CursorPager
          page={records.data}
          search={listSearch}
          isFetching={records.isFetching}
          onCursorChange={(cursor) => onSearchChange({ ...listSearch, cursor })}
        />
      )}
      <LinkDepositDialog record={linking} onClose={() => setLinking(null)} />
    </>
  );
}
