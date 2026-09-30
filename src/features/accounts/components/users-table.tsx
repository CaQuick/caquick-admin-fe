import { Link } from '@tanstack/react-router';
import { type ColumnDef } from '@tanstack/react-table';

import { type AdminUsersQuery } from '@/graphql/generated/graphql';
import { formatCount } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { DataTable } from '@/shared/ui/data-table';

import { identityProvidersLabel } from '../status';
import { AccountStatusPill } from './account-status-pill';

type UserRow = AdminUsersQuery['adminUsers']['items'][number];

const columns: ColumnDef<UserRow, unknown>[] = [
  {
    accessorKey: 'nickname',
    header: '닉네임',
    cell: ({ row }) => (
      <Link
        to="/users/$accountId"
        params={{ accountId: row.original.accountId }}
        className="font-medium text-primary-soft-foreground hover:underline"
      >
        {row.original.nickname ?? '(미설정)'}
      </Link>
    ),
  },
  {
    accessorKey: 'status',
    header: '상태',
    cell: ({ row }) => <AccountStatusPill status={row.original.status} />,
  },
  { accessorKey: 'email', header: '이메일', cell: ({ row }) => row.original.email ?? '—' },
  { accessorKey: 'name', header: '이름', cell: ({ row }) => row.original.name ?? '—' },
  {
    accessorKey: 'identityProviders',
    header: '로그인 수단',
    cell: ({ row }) => identityProvidersLabel(row.original.identityProviders),
  },
  {
    accessorKey: 'orderCount',
    header: '주문',
    meta: { align: 'right' },
    cell: ({ row }) => formatCount(row.original.orderCount),
  },
  {
    accessorKey: 'reviewCount',
    header: '리뷰',
    meta: { align: 'right' },
    cell: ({ row }) => formatCount(row.original.reviewCount),
  },
  {
    accessorKey: 'createdAt',
    header: '가입일',
    cell: ({ row }) => formatKst(row.original.createdAt),
  },
];

export function UsersTable({ rows, isLoading }: { rows: UserRow[]; isLoading: boolean }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(r) => r.accountId}
      isLoading={isLoading}
      emptyMessage="조건에 맞는 구매자가 없습니다."
    />
  );
}
