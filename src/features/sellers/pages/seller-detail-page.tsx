import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { AccountStatusActions, AccountStatusPill } from '@/features/accounts';
import { messageFor } from '@/shared/api';
import { formatKst } from '@/shared/lib/kst';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';
import { StatusPill } from '@/shared/ui/status-pill';

import { invalidateSellers, sellerDetailQueryOptions } from '../api/queries';
import { ResetPasswordDialog } from '../components/reset-password-dialog';

export function SellerDetailPage({ accountId }: { accountId: string }) {
  const queryClient = useQueryClient();
  const q = useQuery(sellerDetailQueryOptions(accountId));
  if (q.isError) {
    return (
      <>
        <PageHeader title="판매자" />
        <p role="alert" className="text-sm text-negative-foreground">
          {messageFor(q.error)}
        </p>
        <Button asChild variant="link" className="px-0">
          <Link to="/sellers">목록으로</Link>
        </Button>
      </>
    );
  }
  if (!q.data) return <Skeleton className="h-64" aria-busy />;
  const s = q.data;
  const label = s.username ?? `#${s.accountId}`;
  const refresh = () => invalidateSellers(queryClient, s.accountId);
  return (
    <>
      <PageHeader
        title={label}
        meta={
          <span className="flex items-center gap-1.5">
            <AccountStatusPill status={s.status} />
            {s.mustChangePassword && <StatusPill tone="caution">비번 변경 필요</StatusPill>}
          </span>
        }
        description={`계정 ID ${s.accountId} · 생성 ${formatKst(s.createdAt, true)} · 마지막 로그인 ${s.lastLoginAt ? formatKst(s.lastLoginAt, true) : '없음'}`}
        actions={
          <>
            <ResetPasswordDialog accountId={s.accountId} label={label} onChanged={refresh} />
            <AccountStatusActions
              accountId={s.accountId}
              status={s.status}
              label={label}
              onChanged={refresh}
            />
          </>
        }
      />
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">계정 · 사업자</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">이름</dt>
              <dd>{s.name ?? '—'}</dd>
              <dt className="text-muted-foreground">이메일</dt>
              <dd className="break-all">{s.email ?? '—'}</dd>
              <dt className="text-muted-foreground">사업자명</dt>
              <dd>{s.profile?.businessName ?? '—'}</dd>
              <dt className="text-muted-foreground">사업자 전화</dt>
              <dd>{s.profile?.businessPhone ?? '—'}</dd>
              <dt className="text-muted-foreground">웹사이트</dt>
              <dd className="break-all">
                {s.profile?.websiteUrl ? (
                  <a
                    href={s.profile.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-soft-foreground hover:underline"
                  >
                    {s.profile.websiteUrl}
                  </a>
                ) : (
                  '—'
                )}
              </dd>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">매장</CardTitle>
          </CardHeader>
          <CardContent>
            {s.store ? (
              <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-1.5 text-sm">
                <dt className="text-muted-foreground">매장</dt>
                <dd className="flex items-center gap-2">
                  {s.store.storeName}
                  <StatusPill tone={s.store.isActive ? 'positive' : 'neutral'}>
                    {s.store.isActive ? '활성' : '비활성'}
                  </StatusPill>
                </dd>
                <dt className="text-muted-foreground">매장 ID</dt>
                <dd className="font-mono">{s.store.id}</dd>
                <dt className="text-muted-foreground">전화</dt>
                <dd>{s.store.storePhone}</dd>
                <dt className="text-muted-foreground">주소</dt>
                <dd>{s.store.addressFull}</dd>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">매장이 없거나 삭제되었습니다.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
