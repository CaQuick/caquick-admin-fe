import { Link } from '@tanstack/react-router';
import { type ColumnDef } from '@tanstack/react-table';

import { type AdminStoresQuery } from '@/graphql/generated/graphql';
import { RegionName } from '@/features/regions';
import { formatKst } from '@/shared/lib/kst';
import { DataTable } from '@/shared/ui/data-table';

import { StoreVisibilityPill } from './store-visibility-pill';

type StoreRow = AdminStoresQuery['adminStores']['items'][number];

const columns: ColumnDef<StoreRow, unknown>[] = [
  {
    accessorKey: 'storeName',
    header: '매장',
    cell: ({ row }) => (
      <Link
        to="/stores/$storeId"
        params={{ storeId: row.original.id }}
        className="font-medium text-primary-soft-foreground hover:underline"
      >
        {row.original.storeName}
      </Link>
    ),
  },
  {
    accessorKey: 'isActive',
    header: '노출',
    cell: ({ row }) => <StoreVisibilityPill isActive={row.original.isActive} />,
  },
  { accessorKey: 'storePhone', header: '매장 전화' },
  {
    accessorKey: 'addressFull',
    header: '주소',
    cell: ({ row }) => <span className="block max-w-72 truncate">{row.original.addressFull}</span>,
  },
  {
    accessorKey: 'regionId',
    header: '지역',
    cell: ({ row }) =>
      row.original.regionId ? <RegionName regionId={row.original.regionId} /> : '—',
  },
  {
    accessorKey: 'sellerAccountId',
    header: '판매자',
    cell: ({ row }) => (
      <Link
        to="/sellers/$accountId"
        params={{ accountId: row.original.sellerAccountId }}
        className="text-primary-soft-foreground hover:underline"
      >
        {row.original.sellerLabel ?? `#${row.original.sellerAccountId}`}
      </Link>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: '등록일',
    cell: ({ row }) => formatKst(row.original.createdAt),
  },
];

export function StoresTable({ rows, isLoading }: { rows: StoreRow[]; isLoading: boolean }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(r) => r.id}
      isLoading={isLoading}
      emptyMessage="조건에 맞는 매장이 없습니다."
    />
  );
}
