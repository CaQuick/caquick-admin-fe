import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { StoreLocationFields } from '@/features/stores';
import { messageFor } from '@/shared/api';
import { INITIAL_PASSWORD_HELP } from '@/shared/lib/initial-password';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { InitialPasswordActions } from '@/shared/ui/initial-password-actions';
import { Input } from '@/shared/ui/input';

import { createSeller } from '../api/queries';
import {
  type CreateSellerValues,
  createSellerSchema,
  toCreateSellerInput,
} from '../create-seller-schema';
import { Field } from './field';

interface Props {
  onCreated: (accountId: string) => void;
}

const TEXT: {
  name: keyof CreateSellerValues;
  label: string;
  required?: boolean;
  type?: string;
  autoComplete?: string;
  help?: string;
}[] = [
  {
    name: 'username',
    label: '아이디',
    required: true,
    autoComplete: 'off',
    help: '4~80자의 영문 소문자, 숫자, 마침표(.), 밑줄(_), 하이픈(-)을 쓸 수 있습니다.',
  },
  {
    name: 'password',
    label: '초기 비밀번호',
    required: true,
    type: 'password',
    autoComplete: 'new-password',
    help: INITIAL_PASSWORD_HELP,
  },
  { name: 'email', label: '이메일', type: 'email' },
  { name: 'name', label: '이름' },
];
const BIZ: typeof TEXT = [
  { name: 'businessName', label: '사업자명', required: true },
  { name: 'businessPhone', label: '사업자 전화', required: true, type: 'tel' },
  { name: 'websiteUrl', label: '웹사이트', type: 'url' },
];
const STORE: typeof TEXT = [
  { name: 'storeName', label: '매장명', required: true },
  { name: 'storePhone', label: '매장 전화', required: true, type: 'tel' },
];

export function CreateSellerForm({ onCreated }: Props) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<CreateSellerValues>({
    resolver: zodResolver(createSellerSchema),
    defaultValues: {
      username: '',
      password: '',
      businessName: '',
      businessPhone: '',
      storeName: '',
      storePhone: '',
      addressFull: '',
      addressCity: '',
      addressDistrict: '',
      addressNeighborhood: '',
      regionId: '',
      latitude: '',
      longitude: '',
      // 구매자 앱은 네이버일 때만 지도를 그린다
      mapProvider: 'NAVER',
    },
  });
  const { errors, isSubmitting } = form.formState;
  const [username, password] = useWatch({ control: form.control, name: ['username', 'password'] });

  const submit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      const created = await createSeller(queryClient, toCreateSellerInput(values));
      onCreated(created.accountId);
    } catch (e) {
      // 저장 버튼은 폼 맨 아래라 위쪽 알림은 화면 밖일 수 있다 — 토스트와 버튼 옆에 함께 알린다
      const message = messageFor(e);
      setError(message);
      toast.error(message);
    }
  });

  const render = (f: (typeof TEXT)[number]) => (
    <Field
      key={f.name}
      id={`cs-${f.name}`}
      label={f.label}
      required={f.required}
      error={errors[f.name]?.message}
      help={f.help}
    >
      <Input
        id={`cs-${f.name}`}
        type={f.type ?? 'text'}
        autoComplete={f.autoComplete ?? 'off'}
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
    </Field>
  );

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">계정</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">{TEXT.map(render)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">사업자</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">{BIZ.map(render)}</CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">매장</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid gap-3 md:grid-cols-2">{STORE.map(render)}</div>
            <StoreLocationFields form={form} idPrefix="cs" />
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {error && (
          <p
            role="alert"
            className="rounded-md bg-negative-soft px-3 py-2 text-sm text-negative-foreground"
          >
            {error}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '등록 중…' : '판매자 등록'}
        </Button>
      </div>
    </form>
  );
}
