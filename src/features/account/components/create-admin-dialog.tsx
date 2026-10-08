import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { type z } from 'zod';

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

import { createAdmin } from '../api/admins';
import { createAdminSchema } from '../create-admin-schema';

type Values = z.infer<typeof createAdminSchema>;

const FIELDS: {
  name: keyof Values;
  label: string;
  type?: string;
  autoComplete: string;
  help?: string;
}[] = [
  {
    name: 'username',
    label: '아이디',
    autoComplete: 'off',
    help: '4~80자의 영문, 숫자, 마침표(.), 밑줄(_), 하이픈(-)을 쓸 수 있습니다. 로그인할 때 대소문자는 구분하지 않습니다.',
  },
  {
    name: 'password',
    label: '초기 비밀번호',
    type: 'password',
    autoComplete: 'new-password',
    help: INITIAL_PASSWORD_HELP,
  },
  { name: 'email', label: '이메일', type: 'email', autoComplete: 'off' },
  { name: 'name', label: '이름', autoComplete: 'off' },
];

export function CreateAdminDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: { username: '', password: '', email: '', name: '' },
  });
  const { errors, isSubmitting } = form.formState;
  const [username, password] = useWatch({ control: form.control, name: ['username', 'password'] });

  const submit = form.handleSubmit(async (v) => {
    setError(null);
    try {
      const created = await createAdmin(qc, {
        username: v.username,
        password: v.password,
        email: v.email === '' ? null : v.email,
        name: v.name === '' ? null : v.name,
      });
      // 아이디는 영문이라 조사를 가릴 수 없다 — 조사가 '계정'에 붙게 쓴다
      toast.success(`${created.username ?? `#${created.accountId}`} 관리자 계정을 추가했습니다.`);
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
        setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="size-4" /> 관리자 추가
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>관리자 추가</DialogTitle>
            <DialogDescription>
              새 관리자 계정을 만듭니다. 정한 초기 비밀번호는 해당 관리자에게 따로 전달해 주세요.
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
          {FIELDS.map((f) => (
            <div key={f.name} className="flex flex-col gap-1.5">
              <Label htmlFor={`ca-${f.name}`}>{f.label}</Label>
              <Input
                id={`ca-${f.name}`}
                type={f.type ?? 'text'}
                autoComplete={f.autoComplete}
                aria-invalid={!!errors[f.name]}
                {...form.register(f.name)}
              />
              {f.name === 'password' && (
                <InitialPasswordActions
                  value={password}
                  username={username}
                  onChange={(v) => form.setValue('password', v, { shouldValidate: true })}
                />
              )}
              {errors[f.name] ? (
                <p className="text-xs text-negative-foreground">{errors[f.name]?.message}</p>
              ) : f.help ? (
                <p className="text-xs text-muted-foreground">{f.help}</p>
              ) : null}
            </div>
          ))}
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
              {isSubmitting ? '추가 중…' : '추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
