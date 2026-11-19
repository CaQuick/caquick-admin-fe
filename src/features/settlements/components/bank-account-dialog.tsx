import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';

import { banksQueryOptions } from '../api/queries';
import { type BankAccountValues, bankAccountSchema, toBankAccount } from '../bank-account';

interface BankAccountInitial {
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
}

interface Props {
  trigger: ReactNode;
  title: string;
  description: ReactNode;
  initial: BankAccountInitial | null;
  /** reject면 열린 채 오류를 폼 위에 보인다. 성공 안내는 호출자가 한다 */
  onSubmit: (input: ReturnType<typeof toBankAccount>) => Promise<void>;
}

/** 은행·계좌번호·예금주·사유. 케이퀵 입금 계좌와 매장 정산 계좌가 같이 쓴다 */
export function BankAccountDialog({ trigger, title, description, initial, onSubmit }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const banks = useQuery({ ...banksQueryOptions(), enabled: open });
  const defaults: BankAccountValues = { ...(initial ?? EMPTY), reason: '' };
  const form = useForm<BankAccountValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: defaults,
  });
  const { errors, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (v) => {
    setError(null);
    try {
      await onSubmit(toBankAccount(v));
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
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
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
            <Label htmlFor="ba-bank">은행</Label>
            <Controller
              control={form.control}
              name="bankCode"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="ba-bank" aria-invalid={!!errors.bankCode} className="w-full">
                    <SelectValue placeholder={banks.isPending ? '불러오는 중…' : '은행 선택'} />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.data?.map((b) => (
                      <SelectItem key={b.code} value={b.code}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {banks.isError && (
              <p className="text-xs text-negative-foreground">{messageFor(banks.error)}</p>
            )}
            {errors.bankCode && (
              <p className="text-xs text-negative-foreground">{errors.bankCode.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ba-number">계좌번호</Label>
            <Input
              id="ba-number"
              inputMode="numeric"
              autoComplete="off"
              aria-invalid={!!errors.accountNumber}
              {...form.register('accountNumber')}
            />
            {errors.accountNumber ? (
              <p className="text-xs text-negative-foreground">{errors.accountNumber.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">하이픈은 빼고 숫자만 저장합니다.</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ba-holder">예금주</Label>
            <Input
              id="ba-holder"
              autoComplete="off"
              aria-invalid={!!errors.accountHolder}
              {...form.register('accountHolder')}
            />
            {errors.accountHolder && (
              <p className="text-xs text-negative-foreground">{errors.accountHolder.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ba-reason">변경 사유 (필수)</Label>
            <Textarea
              id="ba-reason"
              rows={2}
              aria-invalid={!!errors.reason}
              {...form.register('reason')}
            />
            {errors.reason ? (
              <p className="text-xs text-negative-foreground">{errors.reason.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">감사 로그에 남습니다.</p>
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

const EMPTY: BankAccountInitial = { bankCode: '', accountNumber: '', accountHolder: '' };
