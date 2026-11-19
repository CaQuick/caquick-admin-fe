import { type AdminOrderQuery } from '@/graphql/generated/graphql';
import { formatKst } from '@/shared/lib/kst';

type Order = Pick<
  AdminOrderQuery['adminOrder'],
  'status' | 'payment' | 'confirmDeadlineAt' | 'autoPickupAt'
>;

/** 지금 상태에서 시스템이 언제 무엇을 할지. 숨김 매장은 자동 픽업 완료가 돌지 않는다(null = 아직 모름) */
export function autoTransitionNote(o: Order, storeHidden: boolean | null): string | null {
  if (o.status === 'PENDING_PAYMENT' && o.payment) {
    return o.payment.buyerClaimedAt
      ? `구매자가 ${formatKst(o.payment.buyerClaimedAt)}에 입금했다고 알려 자동 취소되지 않습니다. 입금을 확인하거나 미입금으로 취소하세요.`
      : `${formatKst(o.payment.expiresAt)}까지 입금이 확인되지 않으면 자동 취소됩니다.`;
  }
  if (o.status === 'SUBMITTED' && o.confirmDeadlineAt) {
    return `${formatKst(o.confirmDeadlineAt)}까지 판매자가 확정하지 않으면 자동 취소·전액 환불됩니다.`;
  }
  if (o.autoPickupAt) {
    const at = formatKst(o.autoPickupAt);
    if (storeHidden === null)
      return `${at}에 자동 픽업 완료 예정입니다. 매장이 숨김이면 자동으로 처리되지 않습니다.`;
    return storeHidden
      ? `매장이 숨김이라 ${at}에 자동 픽업 완료되지 않습니다. 픽업 완료나 강제 취소로 직접 처리하세요.`
      : `${at}에 자동으로 픽업 완료됩니다.`;
  }
  return null;
}

/** 매장 조회 → 숨김 여부. 조회 중·실패면 옛 값일 수 있어 null(모른다) */
export const storeHiddenOf = (q: {
  data?: { isActive: boolean };
  isSuccess: boolean;
  isFetching: boolean;
}): boolean | null => (q.data && q.isSuccess && !q.isFetching ? !q.data.isActive : null);
