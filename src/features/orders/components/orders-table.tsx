import { Link } from '@tanstack/react-router';
import { type ColumnDef } from '@tanstack/react-table';

import { type AdminOrdersQuery } from '@/graphql/generated/graphql';
import { formatKrw } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { DataTable } from '@/shared/ui/data-table';

import { OrderStatusPill } from './order-status-pill';

export type OrderRow = AdminOrdersQuery['adminOrders']['items'][number];

const columns: ColumnDef<OrderRow, unknown>[] = [
  {
    accessorKey: 'orderNumber',
    header: '주문번호',
    cell: ({ row }) => (
      <Link
        to="/orders/$orderId"
        params={{ orderId: row.original.id }}
        className="font-mono font-medium text-primary-soft-foreground hover:underline"
      >
        {row.original.orderNumber}
      </Link>
    ),
  },
  {
    accessorKey: 'status',
    header: '상태',
    cell: ({ row }) => <OrderStatusPill status={row.original.status} />,
  },
  {
    accessorKey: 'buyerName',
    header: '주문자',
    cell: ({ row }) => (
      <span>
        {row.original.buyerName}
        <span className="block text-[11.5px] text-muted-foreground">{row.original.buyerPhone}</span>
      </span>
    ),
  },
  {
    accessorKey: 'storeName',
    header: '매장',
    cell: ({ row }) => {
      const { storeId, storeName } = row.original;
      // 품목이 없는 주문만 매장이 없다. ID "0"도 매장으로 본다
      if (storeId === null) return '—';
      return (
        <Link
          to="/stores/$storeId"
          params={{ storeId }}
          className="text-primary-soft-foreground hover:underline"
        >
          {storeName ?? `#${storeId}`}
        </Link>
      );
    },
  },
  {
    accessorKey: 'pickupAt',
    header: '픽업 예정',
    cell: ({ row }) => formatKst(row.original.pickupAt),
  },
  {
    accessorKey: 'totalPrice',
    header: '결제 금액',
    meta: { align: 'right' },
    cell: ({ row }) => formatKrw(row.original.totalPrice),
  },
  {
    accessorKey: 'createdAt',
    header: '주문일',
    cell: ({ row }) => formatKst(row.original.createdAt),
  },
];

export function OrdersTable({ rows, isLoading }: { rows: OrderRow[]; isLoading: boolean }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(r) => r.id}
      isLoading={isLoading}
      emptyMessage="조건에 맞는 주문이 없습니다."
    />
  );
}
