import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { ReasonDialog } from '@/shared/ui/reason-dialog';

import { setProductActive } from '../api/queries';

export function ProductActiveToggle({
  productId,
  name,
  isActive,
}: {
  productId: string;
  name: string;
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
          {next ? '상품 노출' : '상품 숨김'}
        </Button>
      }
      title={`${name}을(를) ${next ? '노출' : '숨김'}할까요?`}
      description={
        next
          ? '구매자 화면에 다시 보입니다(매장이 활성일 때).'
          : '구매자 화면에서 숨겨집니다. 내용 수정은 판매자의 몫입니다.'
      }
      reasonRequired={false}
      confirmLabel={next ? '노출' : '숨김'}
      destructive={!next}
      onConfirm={async (reason) => {
        try {
          await setProductActive(queryClient, productId, next, reason || null);
          toast.success(`${name}을(를) ${next ? '노출' : '숨김'} 처리했습니다.`);
        } catch (e) {
          toast.error(messageFor(e));
          throw e;
        }
      }}
    />
  );
}
