import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import {
  type DepositValues,
  depositFormError,
  depositReturnSchema,
  emptyDeposit,
  unidentifiedDepositSchema,
} from '../forms';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** 폼 위에 먼저 보일 안내(입금 확인이 금액 불일치로 거절된 경우 등) */
  notice?: string;
  /** true면 메모 필수(주인 모를 입금 종결) */
  noteRequired: boolean;
  defaults?: Partial<DepositValues>;
  submitLabel: string;
  /** reject면 열린 채 오류를 보인다 */
  onSubmit: (v: DepositValues) => Promise<void>;
}

/** 은행 앱에서 본 입금 1건을 적는 폼(반환 대상 연결·주인 모를 입금 종결 공용) */
export function DepositDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        {/* 열 때마다 새로 마운트해 미리 채운 값으로 시작한다 */}
        <DepositForm {...props} />
      </DialogContent>
    </Dialog>
  );
}

function DepositForm({
  onOpenChange,
  title,
  description,
  notice,
  noteRequired,
  defaults,
  submitLabel,
  onSubmit,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const form = useForm<DepositValues>({
    resolver: zodResolver(noteRequired ? unidentifiedDepositSchema : depositReturnSchema),
    defaultValues: emptyDeposit(defaults),
  });
  const { errors, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (v) => {
    setError(null);
    try {
      await onSubmit(v);
      onOpenChange(false);
    } catch (e) {
      const r = depositFormError(e);
      if (r.field) form.setError(r.field, { type: 'server', message: r.message });
      else if (r.inForm) setError(r.message);
      else toast.error(r.message);
    }
  });

  const fieldError = (name: keyof DepositValues) =>
    errors[name] && <p className="text-xs text-negative-foreground">{errors[name].message}</p>;

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      {(error ?? notice) && (
        <p
          role="alert"
          className="rounded-md bg-negative-soft px-3 py-2 text-sm text-negative-foreground"
        >
          {error ?? notice}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="deposit-amount">입금액(원) (필수)</Label>
          <Input
            id="deposit-amount"
            inputMode="numeric"
            aria-invalid={!!errors.amount}
            {...form.register('amount')}
          />
          {fieldError('amount')}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="deposit-depositor">입금자명 (필수)</Label>
          <Input
            id="deposit-depositor"
            aria-invalid={!!errors.depositorName}
            {...form.register('depositorName')}
          />
          {fieldError('depositorName')}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="deposit-at">입금 일시 (선택, 한국 시간)</Label>
        <Input id="deposit-at" type="datetime-local" {...form.register('depositedAt')} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="deposit-note">메모 {noteRequired ? '(필수)' : '(선택)'}</Label>
        <Textarea
          id="deposit-note"
          rows={3}
          aria-invalid={!!errors.note}
          {...form.register('note')}
        />
        {fieldError('note')}
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
        >
          닫기
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '처리 중…' : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
