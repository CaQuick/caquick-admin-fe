import { zodResolver } from '@hookform/resolvers/zod';
import { type ComponentProps, type ReactNode, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
import { INITIAL_PASSWORD_HELP } from '@/shared/lib/initial-password';
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
import { InitialPasswordActions } from '@/shared/ui/initial-password-actions';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import { type ResetPasswordValues, resetPasswordSchema } from '../reset-password-schema';

interface Props {
  /** 대상 표시 이름(제목·토스트) */
  label: string;
  /** 대상의 역할 이름. 안내 문구에 쓴다(예 '판매자', '관리자') */
  audience: string;
  /** 대상 아이디. 있으면 '아이디로 채우기'를 둔다 */
  username?: string | null;
  /** 초기화 요청. 호출자가 자기 feature의 API와 캐시 무효화를 맡는다 */
  onSubmit: (newPassword: string) => Promise<unknown>;
  triggerSize?: ComponentProps<typeof Button>['size'];
}

/** 판매자·관리자 공용 비밀번호 초기화. 임시 비밀번호를 정하면 대상의 세션이 끊기고 다음 로그인 때 변경이 강제된다. */
export function ResetPasswordDialog({ label, audience, username, onSubmit, triggerSize }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });
  const { errors, isSubmitting } = form.formState;
  const newPassword = useWatch({ control: form.control, name: 'newPassword' });

  const fill = (v: string) => {
    form.setValue('newPassword', v, { shouldValidate: true });
    form.setValue('confirmPassword', v, { shouldValidate: form.formState.isSubmitted });
  };

  const submit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await onSubmit(values.newPassword);
      toast.success(`${label}의 비밀번호를 초기화했습니다.`);
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
        if (!o) {
          setError(null);
          form.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size={triggerSize}>
          비밀번호 초기화
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{label} 비밀번호 초기화</DialogTitle>
            <DialogDescription>
              임시 비밀번호를 정해 {audience}에게 전달해 주세요. {audience}의 로그인 세션은 모두
              끊깁니다.
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
          <PasswordField id="rp-new" label="새 비밀번호" error={errors.newPassword?.message}>
            <Input
              id="rp-new"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.newPassword}
              {...form.register('newPassword')}
            />
            <InitialPasswordActions
              value={newPassword}
              onChange={fill}
              username={username ?? undefined}
            />
            {!errors.newPassword && (
              <p className="text-xs text-muted-foreground">{INITIAL_PASSWORD_HELP}</p>
            )}
          </PasswordField>
          <PasswordField
            id="rp-confirm"
            label="새 비밀번호 확인"
            error={errors.confirmPassword?.message}
          >
            <Input
              id="rp-confirm"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              {...form.register('confirmPassword')}
            />
          </PasswordField>
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

function PasswordField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        <span className="text-negative-foreground"> *</span>
      </Label>
      {children}
      {error && <p className="text-xs text-negative-foreground">{error}</p>}
    </div>
  );
}
