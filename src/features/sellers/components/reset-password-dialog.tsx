import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Input } from '@/shared/ui/input';

import { resetSellerPassword } from '../api/queries';
import { type ResetPasswordValues, resetPasswordSchema } from '../create-seller-schema';
import { Field } from './field';

interface Props {
  accountId: string;
  label: string;
  onChanged: () => Promise<void> | void;
}

export function ResetPasswordDialog({ accountId, label, onChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await resetSellerPassword(accountId, values.newPassword);
      await onChanged();
      toast.success(
        `${label}의 비밀번호를 초기화했습니다. 모든 세션이 끊기고 첫 로그인 때 변경이 강제됩니다.`,
      );
      setOpen(false);
      form.reset();
    } catch (e) {
      setError(messageFor(e));
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">비밀번호 초기화</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{label} 비밀번호 초기화</DialogTitle>
            <DialogDescription>
              임시 비밀번호를 정해 판매자에게 전달하세요. 판매자의 세션은 모두 끊기고 첫 로그인 때
              변경이 강제됩니다.
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
          <Field
            id="rp-new"
            label="새 비밀번호"
            required
            error={errors.newPassword?.message}
            help="8~64자, 알파벳·숫자·특수문자 각 1자 이상"
          >
            <Input
              id="rp-new"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.newPassword}
              {...form.register('newPassword')}
            />
          </Field>
          <Field
            id="rp-confirm"
            label="새 비밀번호 확인"
            required
            error={errors.confirmPassword?.message}
          >
            <Input
              id="rp-confirm"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              {...form.register('confirmPassword')}
            />
          </Field>
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
              {isSubmitting ? '초기화 중…' : '초기화'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
