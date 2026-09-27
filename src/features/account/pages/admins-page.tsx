import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';

import { type AdminAdminsQuery } from '@/graphql/generated/graphql';
import { messageFor } from '@/shared/api';
import { formatCount } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { DEFAULT_LIMIT } from '@/shared/lib/list-search';
import { Card } from '@/shared/ui/card';
import { CursorPager } from '@/shared/ui/cursor-pager';
import { DataTable } from '@/shared/ui/data-table';
import { PageHeader } from '@/shared/ui/page-header';
import { StatusPill } from '@/shared/ui/status-pill';

import { AccountStatusPill } from '@/features/accounts';

import { adminsQueryOptions } from '../api/admins';
import { CreateAdminDialog } from '../components/create-admin-dialog';

type Row = AdminAdminsQuery['adminAdmins']['items'][number];

const columns: ColumnDef<Row, unknown>[] = [
  {
    accessorKey: 'username',
    header: '아이디',
    cell: ({ row }) => <span className="font-medium">{row.original.username ?? '(dev 계정)'}</span>,
  },
  {
    accessorKey: 'status',
    header: '상태',
    cell: ({ row }) => (
      <span className="flex items-center gap-1.5">
        <AccountStatusPill status={row.original.status} />
        {row.original.mustChangePassword && <StatusPill tone="caution">비번 변경 필요</StatusPill>}
      </span>
    ),
  },
  { accessorKey: 'name', header: '이름', cell: ({ row }) => row.original.name ?? '—' },
  { accessorKey: 'email', header: '이메일', cell: ({ row }) => row.original.email ?? '—' },
  {
    accessorKey: 'lastLoginAt',
    header: '마지막 로그인',
    cell: ({ row }) => (row.original.lastLoginAt ? formatKst(row.original.lastLoginAt, true) : '—'),
  },
  {
    accessorKey: 'createdAt',
    header: '생성',
    cell: ({ row }) => formatKst(row.original.createdAt),
  },
];

export function AdminsPage({
  cursor,
  onCursor,
}: {
  cursor: string | undefined;
  onCursor: (cursor: string | undefined) => void;
}) {
  const list = useQuery(adminsQueryOptions({ limit: DEFAULT_LIMIT, cursor: cursor ?? null }));
  return (
    <>
      <PageHeader
        title="관리자"
        meta={list.data ? `전체 ${formatCount(list.data.totalCount)}명` : undefined}
        actions={<CreateAdminDialog />}
      />
      <Card className="gap-0 py-0">
        {list.isError ? (
          <p role="alert" className="px-4 py-8 text-center text-sm text-negative-foreground">
            {messageFor(list.error)}
          </p>
        ) : (
          <DataTable
            columns={columns}
            data={list.data?.items ?? []}
            getRowId={(r) => r.accountId}
            isLoading={list.isPending}
            emptyMessage="관리자가 없습니다."
          />
        )}
        {list.data && (
          <CursorPager
            totalCount={list.data.totalCount}
            shown={list.data.items.length}
            hasMore={list.data.hasMore}
            atStart={!cursor}
            isFetching={list.isFetching}
            onNext={() => list.data?.nextCursor && onCursor(list.data.nextCursor)}
            onReset={() => onCursor(undefined)}
          />
        )}
      </Card>
    </>
  );
}
