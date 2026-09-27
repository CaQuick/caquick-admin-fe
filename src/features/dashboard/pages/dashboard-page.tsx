import { useQuery } from '@tanstack/react-query';

import { messageFor } from '@/shared/api';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';

import { dashboardSummaryQueryOptions, searchKeywordQueryOptions } from '../api/queries';
import { KeywordRanking } from '../components/keyword-ranking';
import { KpiTiles } from '../components/kpi-tiles';
import { OrderStatusChart } from '../components/order-status-chart';
import { PeriodPicker } from '../components/period-picker';
import { type PeriodSearch, type ResolvedPeriod, periodLabel } from '../period';

interface Props {
  period: ResolvedPeriod;
  onPeriodChange: (next: PeriodSearch) => void;
}

export function DashboardPage({ period, onPeriodChange }: Props) {
  const summary = useQuery(dashboardSummaryQueryOptions(period.fromIso, period.toIso));
  const keywords = useQuery(searchKeywordQueryOptions());
  return (
    <>
      <PageHeader
        title="대시보드"
        meta={periodLabel(period)}
        actions={<PeriodPicker period={period} onChange={onPeriodChange} />}
      />
      {summary.isError ? (
        <p role="alert" className="text-sm text-negative-foreground">
          {messageFor(summary.error)}
        </p>
      ) : summary.data ? (
        <KpiTiles summary={summary.data} />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}
      <div className="mt-3 grid gap-3 lg:grid-cols-[3fr_2fr]">
        {summary.data ? <OrderStatusChart summary={summary.data} /> : <Skeleton className="h-72" />}
        {keywords.isError ? (
          <p role="alert" className="text-sm text-negative-foreground">
            {messageFor(keywords.error)}
          </p>
        ) : keywords.data ? (
          <KeywordRanking snapshot={keywords.data} />
        ) : (
          <Skeleton className="h-72" />
        )}
      </div>
    </>
  );
}
