import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { type ColumnDef } from '@tanstack/react-table';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { type AdminMonthlyCommissionsQuery } from '@/graphql/generated/graphql';
import { messageFor } from '@/shared/api';
import { formatCount, formatKrw } from '@/shared/lib/format';
import { Card } from '@/shared/ui/card';
import { DataTable } from '@/shared/ui/data-table';
import { IconButton } from '@/shared/ui/icon-button';
import { Input } from '@/shared/ui/input';
import { PageHeader } from '@/shared/ui/page-header';

import { monthlyCommissionsQueryOptions } from '../api/queries';
import { currentKstMonth, shiftMonth } from '../search';

type Row = AdminMonthlyCommissionsQuery['adminMonthlyCommissions']['stores'][number];

const columns: ColumnDef<Row, unknown>[] = [
  {
    accessorKey: 'storeName',
    header: '매장',
    cell: ({ row }) => (
      <Link
        to="/stores/$storeId"
        params={{ storeId: row.original.storeId }}
        className="text-primary-soft-foreground hover:underline"
      >
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
  {
    accessorKey: 'settlementBaseAmount',
    header: '기준액',
    meta: { align: 'right' },
    cell: ({ row }) => formatKrw(row.original.settlementBaseAmount),
  },
  {
    accessorKey: 'commissionAmount',
    header: '수수료',
    meta: { align: 'right' },
    cell: ({ row }) => formatKrw(row.original.commissionAmount),
  },
];

function Total({ label, value }: { label: string; value: string }) {
  return (
    <Card className="gap-1 px-4 py-3.5">
      <div className="text-[12.5px] text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
    </Card>
  );
}

interface Props {
  /** 'YYYY-MM'. 없으면 이번 달(KST) */
  month: string | undefined;
  onMonthChange: (month: string) => void;
}

export function MonthlyCommissionsPage({ month: picked, onMonthChange }: Props) {
  const month = picked ?? currentKstMonth();
  const q = useQuery(monthlyCommissionsQueryOptions(month));
  return (
    <>
      <PageHeader
        back={{ to: '/settlements', label: '주간 정산' }}
        title="월 수수료"
        description="정산이 확정된 시각(픽업 완료·노쇼·구매자 사정 취소)의 달로 묶습니다. 주간 정산·송금 여부와 무관합니다."
      />
      <div className="mb-3 flex items-center gap-1">
        <IconButton label="이전 달" onClick={() => onMonthChange(shiftMonth(month, -1))}>
          <ChevronLeftIcon className="size-4" />
        </IconButton>
        <Input
          type="month"
          aria-label="집계 월"
          className="h-9 w-40"
          value={month}
          onChange={(e) => e.target.value && onMonthChange(e.target.value)}
        />
        <IconButton label="다음 달" onClick={() => onMonthChange(shiftMonth(month, 1))}>
          <ChevronRightIcon className="size-4" />
        </IconButton>
      </div>
      {q.isError ? (
        <p role="alert" className="text-sm text-negative-foreground">
          {messageFor(q.error)}
        </p>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Total
              label="정산 확정 주문"
              value={q.data ? `${formatCount(q.data.orderCount)}건` : '—'}
            />
            <Total label="기준액" value={q.data ? formatKrw(q.data.settlementBaseAmount) : '—'} />
            <Total label="수수료" value={q.data ? formatKrw(q.data.commissionAmount) : '—'} />
          </div>
          <Card className="gap-0 py-0">
            <DataTable
              columns={columns}
              data={q.data?.stores ?? []}
              getRowId={(r) => r.storeId}
              isLoading={q.isPending}
              emptyMessage="이 달에 정산이 확정된 주문이 없습니다."
            />
          </Card>
        </>
      )}
    </>
  );
}
