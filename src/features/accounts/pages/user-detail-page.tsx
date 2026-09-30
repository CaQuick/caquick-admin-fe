import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { HistoryIcon } from 'lucide-react';

import { messageFor } from '@/shared/api';
import { formatCount } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';

import { invalidateUsers, userDetailQueryOptions } from '../api/queries';
import { AccountStatusActions } from '../components/account-status-actions';
import { AccountStatusPill } from '../components/account-status-pill';
import { identityProvidersLabel } from '../status';

const BACK = { to: '/users' } as const;
const LINK = 'text-primary-soft-foreground hover:underline';

export function UserDetailPage({ accountId }: { accountId: string }) {
  const queryClient = useQueryClient();
  const q = useQuery(userDetailQueryOptions(accountId));
  if (q.isError) {
    return (
      <>
        <PageHeader title="구매자" back={BACK} />
        <p role="alert" className="text-sm text-negative-foreground">
          {messageFor(q.error)}
        </p>
      </>
    );
  }
  if (!q.data) return <Skeleton className="h-64" aria-busy />;
  const u = q.data;
  const label = u.nickname ?? u.email ?? `#${u.accountId}`;
  return (
    <>
      <PageHeader
        title={label}
        back={BACK}
        meta={<AccountStatusPill status={u.status} />}
        description={`계정 ID ${u.accountId} · 가입일 ${formatKst(u.createdAt, true)}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/audit-logs" search={{ targetType: 'ACCOUNT', targetId: u.accountId }}>
                <HistoryIcon className="size-4" /> 감사 이력
              </Link>
            </Button>
            <AccountStatusActions
              accountId={u.accountId}
              status={u.status}
              label={label}
              onChanged={() => invalidateUsers(queryClient, u.accountId)}
            />
          </>
        }
      />
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">프로필</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[104px_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">닉네임</dt>
              <dd>{u.nickname ?? '—'}</dd>
              <dt className="text-muted-foreground">이름</dt>
              <dd>{u.name ?? '—'}</dd>
              <dt className="text-muted-foreground">이메일</dt>
              <dd className="break-all">{u.email ?? '—'}</dd>
              <dt className="text-muted-foreground">전화</dt>
              <dd>{u.phoneNumber ?? '—'}</dd>
              <dt className="text-muted-foreground">로그인 수단</dt>
              <dd>{identityProvidersLabel(u.identityProviders)}</dd>
              <dt className="text-muted-foreground">가입 정보 입력</dt>
              <dd>{u.onboardingCompleted ? '완료' : '미완료'}</dd>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">활동</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[104px_1fr] gap-x-3 gap-y-1.5 text-sm tabular-nums">
              <dt className="text-muted-foreground">주문</dt>
              <dd>
                {formatCount(u.orderCount)}건 ·{' '}
                <Link to="/orders" search={{ accountId: u.accountId }} className={LINK}>
                  주문 보기
                </Link>
              </dd>
              <dt className="text-muted-foreground">리뷰</dt>
              <dd>
                {formatCount(u.reviewCount)}건 ·{' '}
                <Link to="/reviews" search={{ accountId: u.accountId }} className={LINK}>
                  리뷰 보기
                </Link>
              </dd>
            </dl>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
