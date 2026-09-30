import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
import { withJosa } from '@/shared/lib/josa';
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
  const show = !isActive;
  const name = withJosa(storeName, '을/를');
  return (
    <ReasonDialog
      trigger={
        <Button
          variant="outline"
          className={show ? undefined : 'border-negative text-negative-foreground'}
        >
          {show ? '매장 다시 노출' : '매장 숨기기'}
        </Button>
      }
      title={show ? `${name} 다시 노출할까요?` : `${name} 숨길까요?`}
      description={
        show
          ? '구매자 화면에 다시 노출됩니다.'
          : '구매자 화면에서 숨겨집니다. 판매자는 이 값을 바꿀 수 없습니다.'
      }
      reasonRequired={false}
      confirmLabel={show ? '다시 노출' : '숨기기'}
      destructive={!show}
      onConfirm={async (reason) => {
        try {
          await setStoreActive(queryClient, storeId, show, reason || null);
          toast.success(show ? `${name} 다시 노출했습니다.` : `${name} 숨겼습니다.`);
        } catch (e) {
          toast.error(messageFor(e));
          throw e;
        }
      }}
    />
  );
}
