import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { messageFor } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import { login } from '../session';
import { type LoginValues, loginSchema } from '../password-rules';
import { useAuthStore } from '../store';
import { FormError } from './form-error';

interface Props {
  /** 로그인 뒤 이동. mustChangePassword면 무시하고 비밀번호 변경 화면으로 간다. */
  onSuccess: (next: { mustChangePassword: boolean }) => void;
}

export function LoginForm({ onSuccess }: Props) {
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const submit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await login(values.username, values.password);
      onSuccess({ mustChangePassword: useAuthStore.getState().mustChangePassword });
    } catch (e) {
      setError(messageFor(e));
    }
  });

  const { errors, isSubmitting } = form.formState;
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <FormError message={error} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-username">아이디</Label>
        <Input
          id="login-username"
          autoComplete="username"
          autoFocus
          aria-invalid={!!errors.username}
          {...form.register('username')}
        />
        {errors.username && (
          <p className="text-xs text-negative-foreground">{errors.username.message}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-password">비밀번호</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...form.register('password')}
        />
        {errors.password && (
          <p className="text-xs text-negative-foreground">{errors.password.message}</p>
        )}
      </div>
      <Button type="submit" className="mt-1 h-10 w-full" disabled={isSubmitting}>
        {isSubmitting ? '로그인 중…' : '로그인'}
      </Button>
    </form>
  );
}
