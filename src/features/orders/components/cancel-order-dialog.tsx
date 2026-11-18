import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
import { formatKrw } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
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
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';

import { cancelOrder } from '../api/queries';
import {
  CANCEL_NOTE_MAX,
  type CancelForm,
  type CancelOptions,
  EMPTY_CANCEL_FORM,
  asksAmount,
  asksFault,
  buildCancelInput,
  cancelSummary,
  noteLength,
  parseRefundAmount,
} from '../cancel-form';
import { cancelFaultLabel, cancelReasonLabel } from '../meta';

const FAULTS = ['SELLER', 'BUYER'] as const;

export function CancelOrderDialog({
  orderId,
  orderNumber,
  options,
}: {
  orderId: string;
  orderNumber: string;
  options: CancelOptions;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CancelForm>(EMPTY_CANCEL_FORM);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<CancelForm>) => setForm((f) => ({ ...f, ...patch }));
  const built = buildCancelInput(orderId, options, form);
  const summary = cancelSummary(options, form);
  const noteLen = noteLength(form.note);
  const amountInvalid =
    form.refundAmount.trim() !== '' &&
    parseRefundAmount(form.refundAmount, options.paidAmount) === null;

  const submit = async () => {
    if (!('input' in built)) return;
    setBusy(true);
    try {
      await cancelOrder(queryClient, built.input);
      toast.success(`${orderNumber} 주문을 취소했습니다.`);
      setOpen(false);
      setForm(EMPTY_CANCEL_FORM);
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
          강제 취소
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>주문을 강제 취소할까요?</DialogTitle>
          <DialogDescription>
            {orderNumber} 주문을 취소하면 구매자에게 알림이 가고, 입금이 확인된 주문이면
            판매자에게도 알립니다. 사유는 상태 이력과 감사 로그에 남고, 취소한 주문은 되돌릴 수
            없습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cancel-reason">취소 사유 (필수)</Label>
            <Select value={form.reason} onValueChange={(reason) => set({ reason })}>
              <SelectTrigger id="cancel-reason" aria-label="취소 사유" className="w-full">
                <SelectValue placeholder="사유 선택" />
              </SelectTrigger>
              <SelectContent>
                {options.reasons.map((r) => (
                  <SelectItem key={r} value={r}>
                    {cancelReasonLabel(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {asksFault(options) && (
            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1.5 text-sm font-medium">사정 (필수)</legend>
              <div className="grid grid-cols-2 gap-2">
                {FAULTS.map((fault) => (
                  <label
                    key={fault}
                    className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary-soft"
                  >
                    <input
                      type="radio"
                      name="cancel-fault"
                      value={fault}
                      checked={form.fault === fault}
                      onChange={() => set({ fault })}
                      className="accent-primary"
                    />
                    {cancelFaultLabel(fault)}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {asksAmount(options, form) && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cancel-refund">환불 금액 (필수)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="cancel-refund"
                  inputMode="numeric"
                  value={form.refundAmount}
                  onChange={(e) => set({ refundAmount: e.target.value })}
                  aria-invalid={amountInvalid}
                  aria-describedby="cancel-refund-hint"
                  className="tabular-nums"
                />
                <span className="text-sm text-muted-foreground">원</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => set({ refundAmount: String(options.paidAmount) })}
                >
                  전액
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => set({ refundAmount: '0' })}
                >
                  0원
                </Button>
              </div>
              <span
                id="cancel-refund-hint"
                className={cn(
                  'text-xs',
                  amountInvalid ? 'text-negative-foreground' : 'text-muted-foreground',
                )}
              >
                0원 ~ {formatKrw(options.paidAmount)}(확인된 결제액)
              </span>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cancel-note">메모 (선택)</Label>
            <Textarea
              id="cancel-note"
              value={form.note}
              onChange={(e) => set({ note: e.target.value })}
              rows={3}
            />
            <span
              className={cn(
                'text-xs tabular-nums',
                noteLen > CANCEL_NOTE_MAX ? 'text-negative-foreground' : 'text-muted-foreground',
              )}
            >
              {noteLen} / {CANCEL_NOTE_MAX}
            </span>
          </div>
          {summary && (
            <p role="status" className="rounded-md bg-surface-tint px-3 py-2 text-sm">
              {summary}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
            닫기
          </Button>
          <Button variant="destructive" onClick={submit} disabled={busy || !('input' in built)}>
            {busy ? '취소 중…' : '강제 취소'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
