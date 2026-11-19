import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { ApiError, messageFor } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { ReasonDialog } from '@/shared/ui/reason-dialog';

import { completeOrderPickup } from '../api/queries';

// BE 문구는 상태 전이 일반론이라 이 버튼 맥락으로 바꾼다
const MESSAGES: Record<string, string> = {
  ORDER_STATUS_UNCHANGED: '이미 픽업 완료된 주문입니다.',
  INVALID_ORDER_STATUS_TRANSITION: '지금 상태에서는 픽업 완료로 처리할 수 없습니다.',
};

export function CompletePickupDialog({
  orderId,
  orderNumber,
}: {
  orderId: string;
  orderNumber: string;
}) {
  const queryClient = useQueryClient();
  return (
    <ReasonDialog
      trigger={<Button variant="outline">픽업 완료</Button>}
      title="픽업 완료로 처리할까요?"
      description={`${orderNumber} 주문을 픽업 완료로 바꾸고 확인된 결제액으로 정산을 확정합니다. 구매자에게 픽업 완료 알림이 가고, 되돌릴 수 없습니다.`}
      reasonLabel="메모"
      reasonRequired={false}
      confirmLabel="픽업 완료"
      onConfirm={async (note) => {
        try {
          await completeOrderPickup(queryClient, orderId, note);
          toast.success(`${orderNumber} 주문을 픽업 완료로 처리했습니다.`);
        } catch (e) {
          // 거절되면 이미 다른 상태라 재조회로 버튼과 다이얼로그가 사라지므로 토스트로 알린다
          const known = e instanceof ApiError && e.code ? MESSAGES[e.code] : undefined;
          toast.error(known ?? messageFor(e));
          throw e;
        }
      }}
    />
  );
}
