import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ImageUploadField } from '@/features/uploads';
import { messageFor } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import { updateStoreBasicInfo } from '../api/queries';
import {
  type StoreDetail,
  type StoreEditValues,
  diffToInput,
  storeEditSchema,
  toEditValues,
} from '../edit-schema';
import { StoreLocationFields } from './store-location-fields';

const CONTACT: {
  name: 'storeName' | 'storePhone' | 'websiteUrl';
  label: string;
  required?: boolean;
  type?: string;
  help?: string;
}[] = [
  { name: 'storeName', label: '매장명', required: true },
  { name: 'storePhone', label: '매장 전화', required: true, type: 'tel' },
  {
    name: 'websiteUrl',
    label: '웹사이트',
    type: 'url',
    help: '매장 홈페이지나 SNS 주소입니다. 비우면 지웁니다.',
  },
];

export function StoreEditForm({ store, onSaved }: { store: StoreDetail; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const initial = toEditValues(store);
  const form = useForm<StoreEditValues>({
    resolver: zodResolver(storeEditSchema),
    defaultValues: initial,
  });
  const { errors, isSubmitting, isDirty } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    setError(null);
    const input = diffToInput(store.id, initial, values);
    if (!input) {
      toast.info('바뀐 내용이 없습니다.');
      return;
    }
    try {
      await updateStoreBasicInfo(queryClient, input);
      toast.success('매장 정보를 저장했습니다.');
      onSaved();
    } catch (e) {
      const message = messageFor(e);
      setError(message);
      toast.error(message);
    }
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {CONTACT.map((f) => (
            <div key={f.name} className="flex flex-col gap-1.5">
              <Label htmlFor={`se-${f.name}`}>
                {f.label}
                {f.required && <span className="text-negative-foreground"> *</span>}
              </Label>
              <Input
                id={`se-${f.name}`}
                type={f.type ?? 'text'}
                autoComplete="off"
                aria-invalid={!!errors[f.name]}
                {...form.register(f.name)}
              />
              {errors[f.name] ? (
                <p className="text-xs text-negative-foreground">{errors[f.name]?.message}</p>
              ) : f.help ? (
                <p className="text-xs text-muted-foreground">{f.help}</p>
              ) : null}
            </div>
          ))}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="se-businessHoursText">영업시간 안내</Label>
            <Textarea id="se-businessHoursText" rows={2} {...form.register('businessHoursText')} />
            {errors.businessHoursText && (
              <p className="text-xs text-negative-foreground">{errors.businessHoursText.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="se-greetingMessage">인사말</Label>
            <Textarea id="se-greetingMessage" rows={2} {...form.register('greetingMessage')} />
            {errors.greetingMessage ? (
              <p className="text-xs text-negative-foreground">{errors.greetingMessage.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">비우면 기본 문구로 돌아갑니다.</p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">주소와 위치</CardTitle>
        </CardHeader>
        <CardContent>
          <StoreLocationFields form={form} idPrefix="se" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">프로필 이미지</CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            control={form.control}
            name="profileImageUrl"
            render={({ field }) => (
              <ImageUploadField
                id="se-profileImage"
                purpose="STORE_IMAGE"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </CardContent>
      </Card>
      {/* 저장 버튼이 아래에 있어 오류도 버튼 바로 위에 둔다(토스트와 함께) */}
      {error && (
        <p
          role="alert"
          className="rounded-md bg-negative-soft px-3 py-2 text-sm text-negative-foreground"
        >
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => form.reset(initial)}
          disabled={!isDirty || isSubmitting}
        >
          되돌리기
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '저장 중…' : '저장'}
        </Button>
      </div>
    </form>
  );
}
