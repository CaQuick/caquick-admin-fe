import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { messageFor } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

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
    help: '4~80자, 소문자·숫자·. _ -',
  },
  {
    name: 'password',
    label: '초기 비밀번호',
    required: true,
    type: 'password',
    autoComplete: 'new-password',
    help: '첫 로그인 때 변경이 강제됩니다',
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
  { name: 'addressFull', label: '주소', required: true },
  { name: 'addressCity', label: '시/도' },
  { name: 'addressDistrict', label: '시/군/구' },
  { name: 'addressNeighborhood', label: '동/읍/면' },
  { name: 'regionId', label: '지역 ID', help: '활성 2단계 지역의 ID. 지역 화면에서 확인' },
  { name: 'latitude', label: '위도' },
  { name: 'longitude', label: '경도' },
];

export function CreateSellerForm({ onCreated }: Props) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<CreateSellerValues>({
    resolver: zodResolver(createSellerSchema),
    defaultValues: {
      mapProvider: 'NONE',
      username: '',
      password: '',
      businessName: '',
      businessPhone: '',
      storeName: '',
      storePhone: '',
      addressFull: '',
    },
  });
  const { errors, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      const created = await createSeller(queryClient, toCreateSellerInput(values));
      onCreated(created.accountId);
    } catch (e) {
      setError(messageFor(e));
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
    </Field>
  );

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      {error && (
        <p
          role="alert"
          className="rounded-md bg-negative-soft px-3 py-2 text-sm text-negative-foreground"
        >
          {error}
        </p>
      )}
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
          <CardContent className="grid gap-3 md:grid-cols-3">
            {STORE.map(render)}
            <Field id="cs-mapProvider" label="지도 제공자">
              <Controller
                control={form.control}
                name="mapProvider"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="cs-mapProvider" aria-label="지도 제공자">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">없음</SelectItem>
                      <SelectItem value="NAVER">네이버</SelectItem>
                      <SelectItem value="KAKAO">카카오</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '등록 중…' : '판매자 등록'}
        </Button>
      </div>
    </form>
  );
}
