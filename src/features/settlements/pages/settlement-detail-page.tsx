import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { type ColumnDef } from '@tanstack/react-table';
import { HistoryIcon } from 'lucide-react';

import { orderStatusMeta } from '@/features/orders';
import { type AdminSettlementQuery } from '@/graphql/generated/graphql';
import { messageFor } from '@/shared/api';
import { formatCount, formatKrw } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { DataTable } from '@/shared/ui/data-table';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';
import { StatusPill } from '@/shared/ui/status-pill';

import { settlementDetailQueryOptions } from '../api/queries';
import { bpsToPercent } from '../commission-rate';
import { AccountNumber } from '../components/account-number';
import { MarkPaidDialog } from '../components/mark-paid-dialog';
import { actorLabel, settlementStatusMeta } from '../status';

type Settlement = AdminSettlementQuery['adminSettlement'];
type OrderRow = Settlement['orders'][number];

const linkClass = 'text-primary-soft-foreground hover:underline';
const BACK = { to: '/settlements' } as const;

const money = (
  key: 'settlementBaseAmount' | 'commissionAmount' | 'payoutAmount',
  header: string,
): ColumnDef<OrderRow, unknown> => ({
  accessorKey: key,
  header,
  meta: { align: 'right' },
  cell: ({ row }) => formatKrw(row.original[key]),
});

const columns: ColumnDef<OrderRow, unknown>[] = [
  {
    accessorKey: 'orderNumber',
    header: '주문번호',
    cell: ({ row }) => (
      <Link
        to="/orders/$orderId"
        params={{ orderId: row.original.orderId }}
        className={`font-mono ${linkClass}`}
      >
        {row.original.orderNumber}
      </Link>
    ),
  },
  {
    accessorKey: 'productName',
    header: '상품',
    cell: ({ row }) => row.original.productName ?? '—',
  },
  {
    accessorKey: 'status',
    header: '상태',
    cell: ({ row }) => {
      const m = orderStatusMeta(row.original.status);
      return <StatusPill tone={m.tone}>{m.label}</StatusPill>;
    },
  },
  {
    accessorKey: 'commissionRateBps',
    header: '수수료율',
    meta: { align: 'right' },
    cell: ({ row }) => `${bpsToPercent(row.original.commissionRateBps)}%`,
  },
  money('settlementBaseAmount', '기준액'),
  money('commissionAmount', '수수료'),
  money('payoutAmount', '지급액'),
  {
    accessorKey: 'settlementFinalizedAt',
    header: '정산 확정',
    cell: ({ row }) => formatKst(row.original.settlementFinalizedAt),
  },
];

export function SettlementDetailPage({ settlementId }: { settlementId: string }) {
  const q = useQuery(settlementDetailQueryOptions(settlementId));
  if (q.isError) {
    return (
      <>
        <PageHeader title="주간 정산" back={BACK} />
        <p role="alert" className="text-sm text-negative-foreground">
          {messageFor(q.error)}
        </p>
      </>
    );
  }
  if (!q.data) return <Skeleton className="h-64" aria-busy />;
  const s = q.data;
  const status = settlementStatusMeta(s.status);
  return (
    <>
      <PageHeader
        back={BACK}
        title={`${s.storeName} 정산`}
        meta={<StatusPill tone={status.tone}>{status.label}</StatusPill>}
        description={`정산 기간 ${s.periodStart} ~ ${s.periodEnd} · 정산 ID ${s.id} · 생성 ${formatKst(s.createdAt, true)}`}
        actions={
          <Button asChild variant="outline">
            <Link to="/audit-logs" search={{ targetType: 'SETTLEMENT', targetId: s.id }}>
              <HistoryIcon className="size-4" /> 감사 이력
            </Link>
          </Button>
        }
      />
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">금액</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-1.5 text-sm tabular-nums">
              <dt className="text-muted-foreground">매장</dt>
              <dd>
                <Link to="/stores/$storeId" params={{ storeId: s.storeId }} className={linkClass}>
                  {s.storeName}
                </Link>
              </dd>
              <dt className="text-muted-foreground">주문</dt>
              <dd>{formatCount(s.orderCount)}건</dd>
              <dt className="text-muted-foreground">기준액</dt>
              <dd>{formatKrw(s.settlementBaseAmount)}</dd>
              <dt className="text-muted-foreground">수수료</dt>
              <dd>{formatKrw(s.commissionAmount)}</dd>
              <dt className="text-muted-foreground">송금액</dt>
              <dd className="font-semibold">{formatKrw(s.payoutAmount)}</dd>
            </dl>
          </CardContent>
        </Card>
        <Transfer settlement={s} />
      </div>
      <Card className="mt-3 gap-0 pb-0">
        <CardHeader>
          <CardTitle className="text-sm">포함 주문</CardTitle>
        </CardHeader>
        <DataTable
          columns={columns}
          data={s.orders}
          getRowId={(r) => r.orderId}
          emptyMessage="포함된 주문이 없습니다."
        />
      </Card>
    </>
  );
}

function Transfer({ settlement: s }: { settlement: Settlement }) {
  // 모르는 상태에 송금 완료 버튼을 두지 않는다
  if (s.status !== 'PENDING') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">송금</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">송금 완료</dt>
            <dd className="tabular-nums">{s.paidAt ? formatKst(s.paidAt, true) : '—'}</dd>
            <dt className="text-muted-foreground">처리자</dt>
            <dd>{s.paidByLabel ?? '—'}</dd>
            <dt className="text-muted-foreground">송금 계좌</dt>
            <dd>
              {s.paidAccount
                ? `${s.paidAccount.bank.name} ${s.paidAccount.accountNumberMasked}(${s.paidAccount.accountHolder})`
                : '—'}
            </dd>
            <dt className="text-muted-foreground">메모</dt>
            <dd className="whitespace-pre-line">{s.paidNote ?? '—'}</dd>
          </dl>
        </CardContent>
      </Card>
    );
  }
  const account = s.currentAccount;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">송금할 계좌</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {account ? (
          <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">은행</dt>
            <dd>{account.bank.name}</dd>
            <dt className="text-muted-foreground">계좌번호</dt>
            <dd>
              <AccountNumber value={account.accountNumber} />
            </dd>
            <dt className="text-muted-foreground">예금주</dt>
            <dd>{account.accountHolder}</dd>
            <dt className="text-muted-foreground">마지막 변경</dt>
            <dd className="tabular-nums">
              {actorLabel(account.updatedByRole)} · {formatKst(account.updatedAt, true)}
            </dd>
          </dl>
        ) : (
          <p className="text-sm text-caution-foreground">
            매장 정산 계좌가 없어 송금 완료로 처리할 수 없습니다.{' '}
            <Link to="/stores/$storeId" params={{ storeId: s.storeId }} className={linkClass}>
              매장에서 계좌 등록
            </Link>
          </p>
        )}
        <div>
          {account && s.accountRegistered ? (
            <MarkPaidDialog
              settlementId={s.id}
              payoutAmount={s.payoutAmount}
              account={{
                bankName: account.bank.name,
                accountNumber: account.accountNumber,
                accountHolder: account.accountHolder,
              }}
            />
          ) : (
            <Button disabled>송금 완료</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
