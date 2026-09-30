import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { SearchIcon } from 'lucide-react';
import { type ReactNode, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
import { toCoordString } from '@/shared/lib/coords';
import { withJosa } from '@/shared/lib/josa';
import { AddressSearchDialog } from '@/shared/ui/address-search-dialog';
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
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';

import { geocodeAddress, regionMutations } from '../api/queries';
import {
  type Region,
  type RegionFormValues,
  regionFormSchema,
  toCreateInput,
  toFormValues,
  toUpdateInput,
} from '../schema';

interface Props {
  trigger: ReactNode;
  region?: Region;
  /** 생성 시 상위(1단계) 지역. null이면 1단계 생성 */
  parent: Region | null;
}

export function RegionDialog({ trigger, region, parent }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initial = toFormValues(region);
  const form = useForm<RegionFormValues>({
    resolver: zodResolver(regionFormSchema),
    defaultValues: initial,
  });
  const { errors, isSubmitting } = form.formState;
  const levelLabel = (region ? region.level : parent ? 2 : 1) === 1 ? '권역' : '시·군·구';
  const [geocodeNote, setGeocodeNote] = useState<string | null>(null);
  // 주소를 연달아 고르거나 다이얼로그를 닫으면 앞선 응답은 버린다
  const request = useRef(0);

  const fillCenter = async (address: string) => {
    const ticket = ++request.current;
    setGeocodeNote('주소로 좌표를 찾고 있습니다.');
    try {
      const result = await geocodeAddress(qc, address);
      if (ticket !== request.current) return;
      if (!result) {
        setGeocodeNote('이 주소의 좌표를 찾지 못했습니다. 좌표를 직접 입력해 주세요.');
        return;
      }
      const opts = { shouldDirty: true, shouldValidate: true };
      form.setValue('centerLat', toCoordString(result.latitude), opts);
      form.setValue('centerLng', toCoordString(result.longitude), opts);
      setGeocodeNote(`${address}의 좌표로 채웠습니다.`);
    } catch {
      if (ticket !== request.current) return;
      setGeocodeNote('좌표를 자동으로 채우지 못했습니다. 좌표를 직접 입력해 주세요.');
    }
  };

  const submit = form.handleSubmit(async (v) => {
    setError(null);
    try {
      if (region) {
        const input = toUpdateInput(region.id, initial, v);
        if (input) await regionMutations.update(qc, input);
        toast.success(`${withJosa(v.name, '을/를')} 수정했습니다.`);
      } else {
        await regionMutations.create(qc, toCreateInput(v, parent?.id ?? null));
        toast.success(`${withJosa(v.name, '을/를')} 추가했습니다.`);
      }
      setOpen(false);
    } catch (e) {
      setError(messageFor(e));
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        // 닫았다 다시 열면 폼을 새로 채우므로 기다리던 좌표 응답은 버린다
        request.current += 1;
        setOpen(o);
        if (o) form.reset(initial);
        setError(null);
        setGeocodeNote(null);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {region
                ? `${region.name} 수정`
                : `${parent ? `${parent.name} 아래 ` : ''}${levelLabel} 추가`}
            </DialogTitle>
            <DialogDescription>
              {region
                ? '상위 권역과 단계는 바꿀 수 없습니다.'
                : '영문 식별자는 전체에서 하나만 쓸 수 있습니다. 삭제된 지역과 같으면 그 지역을 되살립니다.'}
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
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rg-name">이름</Label>
              <Input id="rg-name" aria-invalid={!!errors.name} {...form.register('name')} />
              {errors.name && (
                <p className="text-xs text-negative-foreground">{errors.name.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rg-slug">영문 식별자</Label>
              <Input
                id="rg-slug"
                placeholder="seoul-gangnam"
                autoComplete="off"
                aria-invalid={!!errors.slug}
                {...form.register('slug')}
              />
              {errors.slug ? (
                <p className="text-xs text-negative-foreground">{errors.slug.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  영문 소문자, 숫자, 하이픈(-)만 씁니다.
                </p>
              )}
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">중심 좌표</span>
                <AddressSearchDialog
                  onSelect={(r) => void fillCenter(r.roadAddress || r.jibunAddress)}
                  trigger={
                    <Button type="button" variant="outline" size="sm" className="h-7">
                      <SearchIcon className="size-3.5" /> 주소로 채우기
                    </Button>
                  }
                />
              </div>
              {geocodeNote ? (
                <p role="status" className="text-xs text-muted-foreground">
                  {geocodeNote}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  지역의 대표 위치입니다. 구청·시청 주소를 검색하면 좌표를 채웁니다.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rg-lat">중심 위도</Label>
              <Input
                id="rg-lat"
                inputMode="decimal"
                autoComplete="off"
                aria-invalid={!!errors.centerLat}
                {...form.register('centerLat')}
              />
              {errors.centerLat && (
                <p className="text-xs text-negative-foreground">{errors.centerLat.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rg-lng">중심 경도</Label>
              <Input
                id="rg-lng"
                inputMode="decimal"
                autoComplete="off"
                aria-invalid={!!errors.centerLng}
                {...form.register('centerLng')}
              />
              {errors.centerLng && (
                <p className="text-xs text-negative-foreground">{errors.centerLng.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rg-sort">정렬 순서</Label>
              <Input
                id="rg-sort"
                type="number"
                {...form.register('sortOrder', { valueAsNumber: true })}
              />
              {errors.sortOrder && (
                <p className="text-xs text-negative-foreground">{errors.sortOrder.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rg-active">노출</Label>
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <Switch id="rg-active" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </div>
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
              {isSubmitting ? '저장 중…' : region ? '저장' : '추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
