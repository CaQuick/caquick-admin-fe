import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import { cancelOrder } from '../api/queries';

const NOTE_MAX = 494;

export function CancelOrderDialog({
  orderId,
  orderNumber,
}: {
  orderId: string;
  orderNumber: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const trimmed = note.trim();
  const invalid = trimmed.length === 0 || trimmed.length > NOTE_MAX;

  const submit = async () => {
    setBusy(true);
    try {
      await cancelOrder(queryClient, orderId, trimmed);
      toast.success(`${orderNumber} 주문을 취소했습니다.`);
      setOpen(false);
      setNote('');
    } catch (e) {
      toast.error(messageFor(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-negative text-negative-foreground">
          주문 취소
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>주문을 취소할까요?</DialogTitle>
          <DialogDescription>
            {orderNumber} — 구매자에게 취소 알림이 가고, 사유는 상태 이력에 "[관리자]" 접두로
            남습니다. 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cancel-note">취소 사유 (필수)</Label>
          <Textarea
            id="cancel-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={NOTE_MAX + 50}
          />
          <span
            className={`text-xs tabular-nums ${trimmed.length > NOTE_MAX ? 'text-negative-foreground' : 'text-muted-foreground'}`}
          >
            {trimmed.length} / {NOTE_MAX}
          </span>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
            닫기
          </Button>
          <Button variant="destructive" onClick={submit} disabled={busy || invalid}>
            {busy ? '취소 중…' : '주문 취소'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
