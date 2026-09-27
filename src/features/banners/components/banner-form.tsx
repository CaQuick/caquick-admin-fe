import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { ImageUploadField } from '@/features/uploads';
import { messageFor } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';

import { createBanner, updateBanner } from '../api/queries';
import {
  type Banner,
  type BannerFormValues,
  LINK_TYPES,
  PLACEMENTS,
  bannerFormSchema,
  defaultBannerValues,
  toCreateInput,
  toFormValues,
  toUpdateInput,
} from '../schema';

const LINK_LABEL: Record<BannerFormValues['linkType'], string | null> = {
  NONE: null,
  URL: '링크 URL',
  PRODUCT: '상품 ID',
  STORE: '매장 ID',
  CATEGORY: '이벤트 카테고리 ID',
};

interface Props {
  banner?: Banner;
  onSaved: (bannerId: string) => void;
}

function Radios<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className="rounded-lg border px-3 py-1.5 text-[13px] aria-checked:border-primary aria-checked:bg-primary-soft aria-checked:font-semibold aria-checked:text-primary-soft-foreground"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function BannerForm({ banner, onSaved }: Props) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const initial = banner ? toFormValues(banner) : defaultBannerValues();
  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: initial,
  });
  const { errors, isSubmitting } = form.formState;
  const placement = form.watch('placement');
  const linkType = form.watch('linkType');
  const placementMeta = PLACEMENTS.find((p) => p.value === placement);

  const submit = form.handleSubmit(async (v) => {
    setError(null);
    try {
      if (banner) {
        const input = toUpdateInput(banner.id, initial, v);
        if (input) await updateBanner(qc, input);
        onSaved(banner.id);
      } else {
        const created = await createBanner(qc, toCreateInput(v));
        onSaved(created.id);
      }
    } catch (e) {
      setError(messageFor(e));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-3 lg:grid-cols-[1fr_300px]">
      <div className="flex flex-col gap-3">
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
            <CardTitle className="text-sm">배치 · 링크</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>배치</Label>
              <Controller
                control={form.control}
                name="placement"
                render={({ field }) => (
                  <Radios
                    name="배치"
                    value={field.value}
                    options={PLACEMENTS}
                    onChange={field.onChange}
                  />
                )}
              />
              {placementMeta?.help && (
                <p className="text-xs text-muted-foreground">{placementMeta.help}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bn-title">제목</Label>
              <Input id="bn-title" {...form.register('title')} />
              {errors.title && (
                <p className="text-xs text-negative-foreground">{errors.title.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>링크 유형</Label>
              <Controller
                control={form.control}
                name="linkType"
                render={({ field }) => (
                  <Radios
                    name="링크 유형"
                    value={field.value}
                    options={LINK_TYPES}
                    onChange={(v) => {
                      field.onChange(v);
                      form.setValue('linkValue', '');
                    }}
                  />
                )}
              />
              {errors.linkType && (
                <p className="text-xs text-negative-foreground">{errors.linkType.message}</p>
              )}
            </div>
            {LINK_LABEL[linkType] && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bn-link">{LINK_LABEL[linkType]}</Label>
                <Input id="bn-link" {...form.register('linkValue')} />
                {errors.linkValue ? (
                  <p className="text-xs text-negative-foreground">{errors.linkValue.message}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    대상이 없거나 비활성·삭제면 저장이 거절됩니다.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">노출</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bn-starts">시작 (KST)</Label>
              <Input id="bn-starts" type="datetime-local" {...form.register('startsAt')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bn-ends">종료 (KST)</Label>
              <Input id="bn-ends" type="datetime-local" {...form.register('endsAt')} />
              {errors.endsAt && (
                <p className="text-xs text-negative-foreground">{errors.endsAt.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bn-sort">정렬 순서</Label>
              <Input
                id="bn-sort"
                type="number"
                {...form.register('sortOrder', { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                구매자는 슬롯당 1개 — 오름차순 → id 오름차순으로 고릅니다.
              </p>
              {errors.sortOrder && (
                <p className="text-xs text-negative-foreground">{errors.sortOrder.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bn-active">활성</Label>
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <Switch id="bn-active" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '저장 중…' : banner ? '저장' : '등록'}
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">이미지</CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <ImageUploadField
                id="bn-image"
                purpose="BANNER_IMAGE"
                value={field.value || null}
                onChange={(url) => field.onChange(url ?? '')}
                aspect="3 / 1"
              />
            )}
          />
          {errors.imageUrl && (
            <p className="mt-1 text-xs text-negative-foreground">{errors.imageUrl.message}</p>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
