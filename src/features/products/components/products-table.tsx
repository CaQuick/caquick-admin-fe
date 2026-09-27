import { Link } from '@tanstack/react-router';
import { type ColumnDef } from '@tanstack/react-table';

import { type AdminProductsQuery } from '@/graphql/generated/graphql';
import { formatKrw } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { DataTable } from '@/shared/ui/data-table';
import { StatusPill } from '@/shared/ui/status-pill';

type ProductRow = AdminProductsQuery['adminProducts']['items'][number];

const columns: ColumnDef<ProductRow, unknown>[] = [
  {
    accessorKey: 'name',
    header: '상품',
    cell: ({ row }) => (
      <span className="flex items-center gap-2.5">
        <span className="size-9 shrink-0 overflow-hidden rounded-md border bg-surface-tint">
          {row.original.baseDesignImageUrl && (
            <img src={row.original.baseDesignImageUrl} alt="" className="size-full object-cover" />
          )}
        </span>
        <Link
          to="/products/$productId"
          params={{ productId: row.original.id }}
          className="font-medium text-primary-soft-foreground hover:underline"
        >
          {row.original.name}
        </Link>
      </span>
    ),
  },
  {
    accessorKey: 'isActive',
    header: '상태',
    cell: ({ row }) => (
      <StatusPill tone={row.original.isActive ? 'positive' : 'neutral'}>
        {row.original.isActive ? '노출' : '숨김'}
      </StatusPill>
    ),
  },
  {
    accessorKey: 'storeName',
    header: '매장',
    cell: ({ row }) => (
      <Link
        to="/stores/$storeId"
        params={{ storeId: row.original.storeId }}
        className="hover:underline"
      >
        {row.original.storeName}
      </Link>
    ),
  },
  {
    accessorKey: 'regularPrice',
    header: '가격',
    meta: { align: 'right' },
    cell: ({ row }) =>
      row.original.salePrice !== null && row.original.salePrice !== undefined ? (
        <span>
          {formatKrw(row.original.salePrice)}
          <span className="ml-1 text-[11.5px] text-muted-foreground line-through">
            {formatKrw(row.original.regularPrice)}
          </span>
        </span>
      ) : (
        formatKrw(row.original.regularPrice)
      ),
  },
  {
    accessorKey: 'updatedAt',
    header: '수정',
    cell: ({ row }) => formatKst(row.original.updatedAt),
  },
];

export function ProductsTable({ rows, isLoading }: { rows: ProductRow[]; isLoading: boolean }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(r) => r.id}
      isLoading={isLoading}
      emptyMessage="조건에 맞는 상품이 없습니다."
    />
  );
}
