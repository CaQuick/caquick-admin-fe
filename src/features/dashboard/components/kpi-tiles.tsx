import { Link } from '@tanstack/react-router';

import { formatCount, formatKrw } from '@/shared/lib/format';
import { Card } from '@/shared/ui/card';

import { type DashboardSummary } from './types';

function Tile({
  label,
  value,
  note,
  alert = false,
}: {
  label: string;
  value: string;
  note?: React.ReactNode;
  alert?: boolean;
}) {
  return (
    <Card className="gap-1 px-4 py-3.5">
      <div className="text-[12.5px] text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      {note && (
        <div
          className={
            alert
              ? 'text-xs font-semibold text-negative-foreground'
              : 'text-xs text-muted-foreground'
          }
        >
          {note}
        </div>
      )}
    </Card>
  );
}

export function KpiTiles({ summary }: { summary: DashboardSummary }) {
  const c = summary.orderCounts;
  const orderTotal = c.submitted + c.confirmed + c.made + c.pickedUp + c.canceled;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile
        label="주문 금액 (취소 제외)"
        value={formatKrw(summary.orderAmountSum)}
        note={`주문 ${formatCount(orderTotal)}건`}
      />
      <Tile
        label="신규 구매자"
        value={`${formatCount(summary.newUserCount)}명`}
        note={`판매자 신규 ${formatCount(summary.newSellerCount)}`}
      />
      <Tile
        label="활성 매장 / 상품"
        value={`${formatCount(summary.activeStoreCount)} / ${formatCount(summary.activeProductCount)}`}
        note="현재 기준"
      />
      <Tile
        label="대기 중 신고"
        value={`${formatCount(summary.pendingReportCount)}건`}
        alert={summary.pendingReportCount > 0}
        note={summary.pendingReportCount > 0 ? <Link to="/reports">처리 필요</Link> : '없음'}
      />
    </div>
  );
}
