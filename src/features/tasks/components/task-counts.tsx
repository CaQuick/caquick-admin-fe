import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { type ReactNode } from 'react';

import { formatCount } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';
import { PageHeader } from '@/shared/ui/page-header';

import { taskCountsQueryOptions } from '../api/queries';
import { taskBadges } from '../meta';

function CountBadge({ count }: { count: number | undefined }) {
  if (!count) return null;
  // 앞 공백·숨긴 '건'은 링크 이름을 '처리 대기 9건'으로 읽히게 한다(flex라 화면에는 영향 없음)
  return (
    <>
      {' '}
      <Badge className="ml-auto h-5 min-w-5 px-1.5 tabular-nums">
        {formatCount(count)}
        <span className="sr-only">건</span>
      </Badge>
    </>
  );
}

/** 사이드바 '처리 대기' 옆 배지. 지금 처리할 수 있는 건수 합계 */
export function TaskCountBadge() {
  const counts = useQuery(taskCountsQueryOptions());
  return <CountBadge count={counts.data && taskBadges(counts.data).total} />;
}

const TABS = [
  { to: '/tasks/deposits', label: '입금', key: 'deposits' },
  { to: '/tasks/refunds', label: '환불', key: 'refunds' },
  { to: '/tasks/settlements', label: '정산 송금', key: 'settlements' },
] as const;

/** 처리 대기 화면 머리글과 탭(입금·환불·정산 송금) */
export function TasksHeader({ actions }: { actions?: ReactNode }) {
  const counts = useQuery(taskCountsQueryOptions());
  const badges = counts.data && taskBadges(counts.data);
  return (
    <>
      <PageHeader
        title="처리 대기"
        description="은행 앱에서 본 입금과 송금을 처리합니다. 건수와 목록은 1분마다 새로 읽습니다."
        actions={actions}
      />
      <nav aria-label="처리 대기 종류" className="mb-3 flex gap-1 border-b">
        {TABS.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="-mb-px flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground data-[status=active]:border-primary data-[status=active]:font-semibold data-[status=active]:text-foreground"
          >
            {t.label}
            <CountBadge count={badges?.[t.key]} />
          </Link>
        ))}
      </nav>
    </>
  );
}

function TileLine({ to, children }: { to: (typeof TABS)[number]['to']; children: ReactNode }) {
  return (
    <Link to={to} className="text-primary-soft-foreground hover:underline">
      {children}
    </Link>
  );
}

/** 대시보드 '처리 대기' 타일 */
export function TasksTile() {
  const counts = useQuery(taskCountsQueryOptions());
  const c = counts.data;
  return (
    <Card className="mb-3 gap-1 px-4 py-3.5">
      <div className="text-[12.5px] text-muted-foreground">처리 대기</div>
      <div className="text-2xl font-bold tabular-nums">
        {c ? `${formatCount(taskBadges(c).total)}건` : '-'}
      </div>
      {c && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums">
          <TileLine to="/tasks/deposits">
            입금 확인 {formatCount(c.pendingPayments)}건(입금했어요 {formatCount(c.claimedPayments)}
            건)
          </TileLine>
          <TileLine to="/tasks/refunds">
            환불 송금 {formatCount(c.refundsAwaitingTransfer)}건 · 계좌 입력 대기{' '}
            {formatCount(c.refundsAwaitingAccount)}건
          </TileLine>
          <TileLine to="/tasks/settlements">
            정산 송금 {formatCount(c.pendingSettlements)}건
          </TileLine>
        </div>
      )}
    </Card>
  );
}
