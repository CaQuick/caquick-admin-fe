import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { ApiError, messageFor } from '@/shared/api';
import { formatKrw } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { ReasonDialog } from '@/shared/ui/reason-dialog';

import { invalidateSettlements, markSettlementPaid } from '../api/queries';

interface Props {
  settlementId: string;
  payoutAmount: number;
  account: { bankName: string; accountNumber: string; accountHolder: string };
}

export function MarkPaidDialog({ settlementId, payoutAmount, account }: Props) {
  const queryClient = useQueryClient();
  return (
    <ReasonDialog
      trigger={<Button>송금 완료</Button>}
      title="송금 완료로 처리할까요?"
      description={`${account.bankName} ${account.accountNumber}(${account.accountHolder})로 ${formatKrw(payoutAmount)}을 송금했나요?`}
      reasonLabel="송금 메모"
      reasonRequired={false}
      confirmLabel="송금 완료"
      onConfirm={async (note) => {
        try {
          await markSettlementPaid(queryClient, settlementId, note || null);
          toast.success('송금 완료로 처리했습니다.');
        } catch (e) {
          toast.error(messageFor(e));
          // 다른 관리자가 먼저 처리했으면 닫고 처리자·시각을 다시 받아 보인다
          if (e instanceof ApiError && e.classification === 'CONFLICT') {
            await invalidateSettlements(queryClient);
            return;
          }
          throw e;
        }
      }}
    />
  );
}
