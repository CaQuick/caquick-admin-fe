import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import { updatePaymentSetting } from '../api/queries';
import { reasonField } from '../bank-account';
import { bpsToPercent, percentToBps } from '../commission-rate';

const schema = z.object({
  rate: z
    .string()
    .trim()
    .refine((v) => percentToBps(v) !== null, '0~100 사이 숫자를 소수 둘째 자리까지 입력해 주세요.'),
  reason: reasonField,
});
type Values = z.infer<typeof schema>;

export function CommissionRateDialog({ currentBps }: { currentBps: number }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaults: Values = { rate: bpsToPercent(currentBps), reason: '' };
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults });
  const { errors, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (v) => {
    setError(null);
    try {
      await updatePaymentSetting(queryClient, {
        commissionRateBps: percentToBps(v.rate),
        reason: v.reason,
      });
      toast.success(`수수료율을 ${v.rate}%로 바꿨습니다.`);
      setOpen(false);
    } catch (e) {
      setError(messageFor(e));
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) form.reset(defaults);
        setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          변경
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>판매 수수료율 변경</DialogTitle>
            <DialogDescription>
              변경 이후 생성되는 주문부터 적용됩니다. 이미 받은 주문의 수수료율은 바뀌지 않습니다.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p
              role="alert"
              className="rounded-md bg-negative-soft px-3 py-2 text-sm text-negative-foreground"
            >
              {error}
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cr-rate">수수료율 (%)</Label>
            <Input
              id="cr-rate"
              inputMode="decimal"
              autoComplete="off"
              className="w-32"
              aria-invalid={!!errors.rate}
              {...form.register('rate')}
            />
            {errors.rate ? (
              <p className="text-xs text-negative-foreground">{errors.rate.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                결제 금액에 곱하고 원 미만은 버립니다. 예: 5.5
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cr-reason">변경 사유 (필수)</Label>
            <Textarea
              id="cr-reason"
              rows={2}
              aria-invalid={!!errors.reason}
              {...form.register('reason')}
            />
            {errors.reason && (
              <p className="text-xs text-negative-foreground">{errors.reason.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              닫기
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중…' : '저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
