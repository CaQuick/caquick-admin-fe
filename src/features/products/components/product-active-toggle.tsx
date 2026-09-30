import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
import { withJosa } from '@/shared/lib/josa';
import { Button } from '@/shared/ui/button';
import { ReasonDialog } from '@/shared/ui/reason-dialog';

import { setProductActive } from '../api/queries';

export function ProductActiveToggle({
  productId,
  name,
  isActive,
  storeIsActive,
}: {
  productId: string;
  name: string;
  isActive: boolean;
  storeIsActive: boolean;
}) {
  const queryClient = useQueryClient();
  const next = !isActive;
  const target = withJosa(name, '을/를');
  let description =
    '구매자 화면에서 이 상품이 보이지 않게 됩니다. 상품 내용은 판매자가 수정합니다.';
  if (next) {
    description = storeIsActive
      ? '구매자 화면에 이 상품이 다시 보입니다.'
      : '매장이 숨김 상태라 매장을 다시 노출해야 구매자 화면에 보입니다.';
  }
  return (
    <ReasonDialog
      trigger={
        <Button
          variant="outline"
          className={next ? undefined : 'border-negative text-negative-foreground'}
        >
          {next ? '다시 노출' : '숨기기'}
        </Button>
      }
      title={next ? `${target} 다시 노출할까요?` : `${target} 숨길까요?`}
      description={description}
      reasonRequired={false}
      confirmLabel={next ? '다시 노출' : '숨기기'}
      destructive={!next}
      onConfirm={async (reason) => {
        try {
          await setProductActive(queryClient, productId, next, reason || null);
          toast.success(next ? `${target} 다시 노출했습니다.` : `${target} 숨겼습니다.`);
        } catch (e) {
          toast.error(messageFor(e));
          throw e;
        }
      }}
    />
  );
}
