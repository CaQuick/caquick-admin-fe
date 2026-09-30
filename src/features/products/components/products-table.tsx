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
    // 판매가를 늘 첫 줄 오른쪽 끝에 둔다. 할인 중이면 정가를 둘째 줄에 작게
    cell: ({ row }) => {
      const { salePrice, regularPrice } = row.original;
      const onSale = salePrice !== null && salePrice !== undefined;
      return (
        <span className="flex flex-col items-end leading-tight">
          <span>{formatKrw(onSale ? salePrice : regularPrice)}</span>
          {onSale && (
            <span className="text-[11.5px] text-muted-foreground">
              <span className="sr-only">정가 </span>
              <s>{formatKrw(regularPrice)}</s>
            </span>
          )}
        </span>
      );
    },
  },
  {
    accessorKey: 'updatedAt',
    header: '수정일',
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
