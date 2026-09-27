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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';

import { updateStoreBasicInfo } from '../api/queries';
import {
  type StoreDetail,
  type StoreEditValues,
  diffToInput,
  storeEditSchema,
  toEditValues,
} from '../edit-schema';

const FIELDS: {
  name: Exclude<
    keyof StoreEditValues,
    'mapProvider' | 'profileImageUrl' | 'greetingMessage' | 'businessHoursText'
  >;
  label: string;
  required?: boolean;
  help?: string;
}[] = [
  { name: 'storeName', label: '매장명', required: true },
  { name: 'storePhone', label: '전화', required: true },
  { name: 'addressFull', label: '주소', required: true },
  { name: 'addressCity', label: '시/도' },
  { name: 'addressDistrict', label: '시/군/구' },
  { name: 'addressNeighborhood', label: '동/읍/면' },
  { name: 'regionId', label: '지역 ID', help: '활성 2단계 지역. 비우면 연결 해제' },
  { name: 'latitude', label: '위도' },
  { name: 'longitude', label: '경도' },
  { name: 'websiteUrl', label: '웹사이트' },
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
      setError(messageFor(e));
    }
  });

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
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.name} className="flex flex-col gap-1.5">
              <Label htmlFor={`se-${f.name}`}>
                {f.label}
                {f.required && <span className="text-negative-foreground"> *</span>}
              </Label>
              <Input
                id={`se-${f.name}`}
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="se-mapProvider">지도 제공자</Label>
            <Controller
              control={form.control}
              name="mapProvider"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="se-mapProvider" aria-label="지도 제공자">
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
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="se-businessHoursText">영업시간 안내</Label>
            <Textarea id="se-businessHoursText" rows={2} {...form.register('businessHoursText')} />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="se-greetingMessage">인사말</Label>
            <Textarea id="se-greetingMessage" rows={2} {...form.register('greetingMessage')} />
            <p className="text-xs text-muted-foreground">비우면 기본 문구로 돌아갑니다.</p>
          </div>
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
