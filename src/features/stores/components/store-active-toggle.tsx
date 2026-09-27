import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { ReasonDialog } from '@/shared/ui/reason-dialog';

import { setStoreActive } from '../api/queries';

export function StoreActiveToggle({
  storeId,
  storeName,
  isActive,
}: {
  storeId: string;
  storeName: string;
  isActive: boolean;
}) {
  const queryClient = useQueryClient();
  const next = !isActive;
  return (
    <ReasonDialog
      trigger={
        <Button
          variant="outline"
          className={next ? undefined : 'border-negative text-negative-foreground'}
        >
          {next ? '매장 활성화' : '매장 비활성화'}
        </Button>
      }
      title={`${storeName}을(를) ${next ? '활성화' : '비활성화'}할까요?`}
      description={
        next
          ? '구매자 화면에 다시 노출됩니다.'
          : '구매자 화면에서 숨겨집니다. 판매자는 이 값을 바꿀 수 없습니다.'
      }
      reasonRequired={false}
      confirmLabel={next ? '활성화' : '비활성화'}
      destructive={!next}
      onConfirm={async (reason) => {
        try {
          await setStoreActive(queryClient, storeId, next, reason || null);
          toast.success(`${storeName}을(를) ${next ? '활성화' : '비활성화'}했습니다.`);
        } catch (e) {
          toast.error(messageFor(e));
          throw e;
        }
      }}
    />
  );
}
