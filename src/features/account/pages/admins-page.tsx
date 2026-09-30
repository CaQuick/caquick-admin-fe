import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

import { accountLabel, AccountStatusPill, ResetPasswordDialog } from '@/features/accounts';
import { type AdminAdminsQuery } from '@/graphql/generated/graphql';
import { messageFor } from '@/shared/api';
import { formatCount } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { DEFAULT_LIMIT } from '@/shared/lib/list-search';
import { Card } from '@/shared/ui/card';
import { CursorPager } from '@/shared/ui/cursor-pager';
import { DataTable } from '@/shared/ui/data-table';
import { IconButton } from '@/shared/ui/icon-button';
import { PageHeader } from '@/shared/ui/page-header';
import { StatusPill } from '@/shared/ui/status-pill';

import { adminsQueryOptions, resetAdminPassword } from '../api/admins';
import { adminMeQueryOptions } from '../api/queries';
import { CreateAdminDialog } from '../components/create-admin-dialog';
import { resetBlockedReason } from '../reset-blocked-reason';

type Row = AdminAdminsQuery['adminAdmins']['items'][number];

function ResetCell({ row, meId }: { row: Row; meId: string | undefined }) {
  const qc = useQueryClient();
  const blocked = resetBlockedReason(row, meId);
  if (blocked !== null) {
    return (
      <IconButton label="비밀번호 초기화" disabledReason={blocked} variant="outline" size="sm">
        비밀번호 초기화
      </IconButton>
    );
  }
  return (
    <ResetPasswordDialog
      label={accountLabel(row)}
      audience="관리자"
      username={row.username}
      triggerSize="sm"
      onSubmit={(pw) => resetAdminPassword(qc, row.accountId, pw)}
    />
  );
}

function buildColumns(meId: string | undefined): ColumnDef<Row, unknown>[] {
  return [
    {
      accessorKey: 'username',
      header: '아이디',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.username ?? '(아이디 없음)'}</span>
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
    { accessorKey: 'name', header: '이름', cell: ({ row }) => row.original.name ?? '—' },
    { accessorKey: 'email', header: '이메일', cell: ({ row }) => row.original.email ?? '—' },
    {
      accessorKey: 'lastLoginAt',
      header: '최근 로그인',
      cell: ({ row }) =>
        row.original.lastLoginAt ? formatKst(row.original.lastLoginAt, true) : '—',
    },
    {
      accessorKey: 'createdAt',
      header: '등록일',
      cell: ({ row }) => formatKst(row.original.createdAt),
    },
    {
      id: 'actions',
      header: '',
      meta: { align: 'right' },
      cell: ({ row }) => <ResetCell row={row.original} meId={meId} />,
    },
  ];
}

export function AdminsPage({
  cursor,
  onCursor,
}: {
  cursor: string | undefined;
  onCursor: (cursor: string | undefined) => void;
}) {
  const list = useQuery(adminsQueryOptions({ limit: DEFAULT_LIMIT, cursor: cursor ?? null }));
  const me = useQuery(adminMeQueryOptions());
  const meId = me.data?.accountId;
  const columns = useMemo(() => buildColumns(meId), [meId]);
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
            page={list.data}
            search={{ cursor }}
            isFetching={list.isFetching}
            onCursorChange={onCursor}
          />
        )}
      </Card>
    </>
  );
}
