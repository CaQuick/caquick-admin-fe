import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { messageFor } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import { changePassword } from '../session';
import { type ChangePasswordValues, changePasswordSchema } from '../password-rules';
import { FormError } from './form-error';

interface Props {
  onSuccess: () => void;
}

const FIELDS: { name: keyof ChangePasswordValues; label: string; autoComplete: string }[] = [
  { name: 'currentPassword', label: '현재 비밀번호', autoComplete: 'current-password' },
  { name: 'newPassword', label: '새 비밀번호', autoComplete: 'new-password' },
  { name: 'confirmPassword', label: '새 비밀번호 확인', autoComplete: 'new-password' },
];

export function ChangePasswordForm({ onSuccess }: Props) {
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const submit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      onSuccess();
    } catch (e) {
      setError(messageFor(e));
    }
  });

  const { errors, isSubmitting } = form.formState;
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <FormError message={error} />
      {FIELDS.map((f) => (
        <div key={f.name} className="flex flex-col gap-1.5">
          <Label htmlFor={`cp-${f.name}`}>{f.label}</Label>
          <Input
            id={`cp-${f.name}`}
            type="password"
            autoComplete={f.autoComplete}
            aria-invalid={!!errors[f.name]}
            {...form.register(f.name)}
          />
          {errors[f.name] && (
            <p className="text-xs text-negative-foreground">{errors[f.name]?.message}</p>
          )}
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        8~64자, 대문자·소문자·숫자·특수문자를 각각 1자 이상. 변경하면 다시 로그인합니다.
      </p>
      <Button type="submit" className="mt-1 h-10 w-full" disabled={isSubmitting}>
        {isSubmitting ? '변경 중…' : '비밀번호 변경'}
      </Button>
    </form>
  );
}
