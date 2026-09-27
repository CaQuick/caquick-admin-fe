import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
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

import { regionMutations } from '../api/queries';
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
  const levelLabel =
    (region ? region.level : parent ? 2 : 1) === 1 ? '1단계(권역)' : '2단계(시·군·구)';

  const submit = form.handleSubmit(async (v) => {
    setError(null);
    try {
      if (region) {
        const input = toUpdateInput(region.id, initial, v);
        if (input) await regionMutations.update(qc, input);
        toast.success(`${v.name} 지역을 수정했습니다.`);
      } else {
        await regionMutations.create(qc, toCreateInput(v, parent?.id ?? null));
        toast.success(`${v.name} 지역을 만들었습니다.`);
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
        setOpen(o);
        if (o) form.reset(initial);
        setError(null);
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
                ? '상위·단계는 바꿀 수 없습니다.'
                : 'slug는 전체에서 유일합니다. 삭제된 같은 slug가 있으면 복구됩니다.'}
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
              <Label htmlFor="rg-slug">slug</Label>
              <Input id="rg-slug" aria-invalid={!!errors.slug} {...form.register('slug')} />
              {errors.slug && (
                <p className="text-xs text-negative-foreground">{errors.slug.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rg-lat">중심 위도</Label>
              <Input
                id="rg-lat"
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
              <Label htmlFor="rg-active">활성</Label>
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
