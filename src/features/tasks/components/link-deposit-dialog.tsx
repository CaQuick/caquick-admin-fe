import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
import { formatKrw } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { EntityPicker } from '@/shared/ui/entity-picker';

import { type DepositRecord, orderOptionsQueryOptions, taskMutations } from '../api/queries';
import { isConflict } from '../meta';

/** 종결 기록의 주인을 찾았을 때 그 주문의 반환 대상으로 바꾼다(같은 입금을 새로 기록하지 않는다) */
export function LinkDepositDialog({
  record,
  onClose,
}: {
  record: DepositRecord | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={record !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>{record && <LinkForm record={record} onClose={onClose} />}</DialogContent>
    </Dialog>
  );
}

function LinkForm({ record, onClose }: { record: DepositRecord; onClose: () => void }) {
  const qc = useQueryClient();
  const [orderId, setOrderId] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (orderId === undefined) return;
    setBusy(true);
    try {
      await taskMutations.linkUnidentifiedDeposit(qc, record.id, orderId);
      toast.success(
        '종결 기록을 반환 대상으로 바꿨습니다. 구매자에게 환불 계좌 입력을 요청했어요.',
      );
      onClose();
    } catch (e) {
      toast.error(messageFor(e));
      if (isConflict(e)) onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>주문에 연결</DialogTitle>
        <DialogDescription>
          {record.depositorName} {formatKrw(record.amount)} 종결 기록을 고른 주문의 반환 대상으로
          바꿉니다. 입금액 전액의 환불이 생기고 구매자에게 환불 계좌 입력을 요청합니다.
        </DialogDescription>
      </DialogHeader>
      <EntityPicker
        label="주문"
        placeholder="주문번호·주문자 이름·연락처로 찾기"
        value={orderId}
        onChange={(id) => setOrderId(id)}
        searchQuery={orderOptionsQueryOptions}
        idEntry={false}
      />
      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          닫기
        </Button>
        <Button onClick={submit} disabled={busy || orderId === undefined}>
          {busy ? '처리 중…' : '반환 대상으로 연결'}
        </Button>
      </DialogFooter>
    </>
  );
}
