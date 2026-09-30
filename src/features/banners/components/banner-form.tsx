import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ImageUploadField } from '@/features/uploads';
import { messageFor } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { EntityPicker } from '@/shared/ui/entity-picker';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';

import {
  type LinkTargetKind,
  createBanner,
  linkLabelQueryOptions,
  linkOptionsQueryOptions,
  updateBanner,
} from '../api/queries';
import {
  type Banner,
  type BannerFormValues,
  LINK_TYPES,
  PLACEMENTS,
  SORT_ORDER_MAX,
  SORT_ORDER_MIN,
  bannerFormSchema,
  defaultBannerValues,
  toCreateInput,
  toFormValues,
  toUpdateInput,
} from '../schema';

/** 선택기로 고르는 링크 대상과 그 이름 */
const PICKER_LABEL: Record<LinkTargetKind, string> = {
  PRODUCT: '상품',
  STORE: '매장',
  CATEGORY: '이벤트 카테고리',
};
const isPickerKind = (v: BannerFormValues['linkType']): v is LinkTargetKind =>
  v === 'PRODUCT' || v === 'STORE' || v === 'CATEGORY';

/** 링크 대상 선택기. 저장된 대상은 이름을 한 번 읽어 보여 준다(새로 고른 대상은 선택기가 이름을 안다) */
function LinkTargetPicker({
  kind,
  value,
  savedValue,
  onChange,
}: {
  kind: LinkTargetKind;
  value: string;
  /** 서버에 저장된 같은 유형의 대상 ID. 없으면 undefined */
  savedValue: string | undefined;
  onChange: (id: string) => void;
}) {
  const isSaved = value !== '' && value === savedValue;
  const saved = useQuery({ ...linkLabelQueryOptions(kind, value), enabled: isSaved });
  return (
    <EntityPicker
      label={PICKER_LABEL[kind]}
      value={value === '' ? undefined : value}
      onChange={(id) => onChange(id ?? '')}
      searchQuery={(keyword) => linkOptionsQueryOptions(kind, keyword)}
      selectedLabel={isSaved ? (saved.data ?? undefined) : undefined}
      idEntry={false}
      className="[&>button[role=combobox]]:w-72"
    />
  );
}

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
  const linkValue = form.watch('linkValue');

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
      const message = messageFor(e);
      setError(message);
      toast.error(message);
    }
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-3 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-3">
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
            {linkType !== 'NONE' && (
              <div className="flex flex-col gap-1.5">
                {isPickerKind(linkType) ? (
                  <>
                    <span className="text-sm font-medium">연결할 {PICKER_LABEL[linkType]}</span>
                    <LinkTargetPicker
                      kind={linkType}
                      value={linkValue}
                      savedValue={
                        banner && initial.linkType === linkType ? initial.linkValue : undefined
                      }
                      onChange={(id) =>
                        form.setValue('linkValue', id, {
                          shouldValidate: form.formState.isSubmitted,
                        })
                      }
                    />
                  </>
                ) : (
                  <>
                    <Label htmlFor="bn-link">웹 주소</Label>
                    <Input
                      id="bn-link"
                      type="url"
                      placeholder="https://"
                      {...form.register('linkValue')}
                    />
                  </>
                )}
                {errors.linkValue ? (
                  <p className="text-xs text-negative-foreground">{errors.linkValue.message}</p>
                ) : (
                  isPickerKind(linkType) && (
                    <p className="text-xs text-muted-foreground">
                      숨김이거나 삭제된 대상은 연결할 수 없습니다.
                    </p>
                  )
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
              <Label htmlFor="bn-starts">시작(한국 시간)</Label>
              <Input id="bn-starts" type="datetime-local" {...form.register('startsAt')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bn-ends">종료(한국 시간)</Label>
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
                step={1}
                min={SORT_ORDER_MIN}
                max={SORT_ORDER_MAX}
                {...form.register('sortOrder', { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                정렬 순서가 가장 작은 배너 1개가 노출됩니다(같으면 먼저 등록한 것).
              </p>
              {errors.sortOrder && (
                <p className="text-xs text-negative-foreground">{errors.sortOrder.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bn-active">노출</Label>
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <Switch id="bn-active" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <p className="text-xs text-muted-foreground">
                끄면 노출 기간 안이어도 구매자에게 보이지 않습니다.
              </p>
            </div>
          </CardContent>
        </Card>
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
                previewClassName="w-full"
              />
            )}
          />
          {errors.imageUrl && (
            <p className="mt-1 text-xs text-negative-foreground">{errors.imageUrl.message}</p>
          )}
        </CardContent>
      </Card>
      {/* 좁은 화면에서도 이미지 카드 아래, 폼 맨 끝에 둔다. 실패 문구는 누른 버튼 곁에 */}
      <div className="flex flex-col gap-2 lg:col-span-2">
        {error && (
          <p
            role="alert"
            className="rounded-md bg-negative-soft px-3 py-2 text-sm text-negative-foreground"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '저장 중…' : banner ? '저장' : '등록'}
          </Button>
        </div>
      </div>
    </form>
  );
}
