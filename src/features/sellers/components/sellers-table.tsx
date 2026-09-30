import { Link } from '@tanstack/react-router';
import { type ColumnDef } from '@tanstack/react-table';

import { AccountStatusPill } from '@/features/accounts';
import { type AdminSellersQuery } from '@/graphql/generated/graphql';
import { formatKst } from '@/shared/lib/kst';
import { DataTable } from '@/shared/ui/data-table';
import { StatusPill } from '@/shared/ui/status-pill';

import { StoreVisibilityPill } from './store-visibility-pill';

type SellerRow = AdminSellersQuery['adminSellers']['items'][number];

const columns: ColumnDef<SellerRow, unknown>[] = [
  {
    accessorKey: 'username',
    header: '아이디',
    cell: ({ row }) => (
      <Link
        to="/sellers/$accountId"
        params={{ accountId: row.original.accountId }}
        className="font-medium text-primary-soft-foreground hover:underline"
      >
        {row.original.username ?? `#${row.original.accountId}`}
      </Link>
    ),
  },
  {
    accessorKey: 'status',
    header: '상태',
    cell: ({ row }) => (
      <span className="flex items-center gap-1.5">
        <AccountStatusPill status={row.original.status} />
        {row.original.mustChangePassword && (
          <StatusPill tone="caution">비밀번호 변경 필요</StatusPill>
        )}
      </span>
    ),
  },
  {
    id: 'businessName',
    header: '사업자',
    cell: ({ row }) => row.original.profile?.businessName ?? '—',
  },
  {
    id: 'store',
    header: '매장',
    cell: ({ row }) =>
      row.original.store ? (
        <span className="flex items-center gap-1.5">
          <Link
            to="/stores/$storeId"
            params={{ storeId: row.original.store.id }}
            className="text-primary-soft-foreground hover:underline"
          >
            {row.original.store.storeName}
          </Link>
          <StoreVisibilityPill isActive={row.original.store.isActive} />
        </span>
      ) : (
        '—'
      ),
  },
  { accessorKey: 'email', header: '이메일', cell: ({ row }) => row.original.email ?? '—' },
  {
    accessorKey: 'lastLoginAt',
    header: '최근 로그인',
    cell: ({ row }) => (row.original.lastLoginAt ? formatKst(row.original.lastLoginAt) : '—'),
  },
  {
    accessorKey: 'createdAt',
    header: '등록일',
    cell: ({ row }) => formatKst(row.original.createdAt),
  },
];

export function SellersTable({ rows, isLoading }: { rows: SellerRow[]; isLoading: boolean }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(r) => r.accountId}
      isLoading={isLoading}
      emptyMessage="조건에 맞는 판매자가 없습니다."
    />
  );
}
