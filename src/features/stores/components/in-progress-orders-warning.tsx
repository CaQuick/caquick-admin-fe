import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { TriangleAlertIcon } from 'lucide-react';

import { orderStatusMeta } from '@/features/orders';
import { formatCount } from '@/shared/lib/format';

import { storeInProgressOrdersQueryOptions } from '../api/queries';

/**
 * 매장 숨기기·판매자 정지 앞의 경고. 진행 주문은 자동으로 취소되지 않아 관리자가 건별로 처리해야 한다.
 * 경고일 뿐 막지 않는다 — 조회가 실패해도 다이얼로그는 그대로 쓸 수 있다.
 */
export function InProgressOrdersWarning({ storeId }: { storeId: string }) {
  const q = useQuery(storeInProgressOrdersQueryOptions(storeId));
  if (q.isError) {
    return (
      <p className="text-xs text-muted-foreground">진행 중인 주문 수를 확인하지 못했습니다.</p>
    );
  }
  if (!q.data || q.data.totalCount === 0) return null;
  const parts = q.data.byStatus
    .map((s) => `${orderStatusMeta(s.status).label} ${formatCount(s.count)}`)
    .join(' · ');
  return (
    <div
      role="alert"
      className="flex gap-2 rounded-md bg-caution-soft px-3 py-2 text-sm text-caution-foreground"
    >
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="flex flex-col gap-1">
        <p>
          진행 중인 주문 {formatCount(q.data.totalCount)}건({parts})이 있습니다. 자동으로 취소되지
          않으니 건별로 처리하세요.
        </p>
        <Link
          to="/orders"
          search={{ storeId, inProgress: 'true' }}
          className="w-fit font-medium underline underline-offset-2"
        >
          진행 주문 보기
        </Link>
      </div>
    </div>
  );
}
