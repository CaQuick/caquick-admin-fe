import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { type AdminCategoriesQuery } from '@/graphql/generated/graphql';
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
import { Textarea } from '@/shared/ui/textarea';

import { categoryMutations } from '../api/queries';
import {
  CATEGORY_TYPES,
  type CategoryFormValues,
  type CategoryType,
  categoryFormSchema,
} from '../schemas';

type Category = AdminCategoriesQuery['adminCategories'][number];

interface Props {
  trigger: ReactNode;
  /** 있으면 수정, 없으면 생성 */
  category?: Category;
  categoryType: CategoryType;
}

export function CategoryDialog({ trigger, category, categoryType }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initial: CategoryFormValues = category
    ? {
        name: category.name,
        description: category.description ?? '',
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      }
    : { name: '', description: '', sortOrder: 0, isActive: true };
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: initial,
  });
  const { errors, isSubmitting } = form.formState;
  const typeLabel = CATEGORY_TYPES.find((t) => t.value === categoryType)?.label ?? categoryType;

  const submit = form.handleSubmit(async (v) => {
    setError(null);
    try {
      if (category) {
        await categoryMutations.update(qc, {
          categoryId: category.id,
          name: v.name,
          description: v.description === '' ? null : v.description,
          sortOrder: v.sortOrder,
          isActive: v.isActive,
        });
        toast.success(`${v.name} 카테고리를 수정했습니다.`);
      } else {
        await categoryMutations.create(qc, {
          categoryType,
          name: v.name,
          description: v.description === '' ? null : v.description,
          sortOrder: v.sortOrder,
          isActive: v.isActive,
        });
        toast.success(`${v.name} 카테고리를 만들었습니다.`);
      }
      setOpen(false);
      form.reset(category ? v : initial);
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
            <DialogTitle>{category ? '카테고리 수정' : `${typeLabel} 카테고리 추가`}</DialogTitle>
            <DialogDescription>
              {category
                ? '유형은 바꿀 수 없습니다.'
                : '같은 유형 안에 같은 이름이 있으면 추가할 수 없습니다. 삭제된 같은 이름이 있으면 그 카테고리가 복구됩니다.'}
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-name">이름</Label>
            <Input id="cat-name" aria-invalid={!!errors.name} {...form.register('name')} />
            {errors.name && (
              <p className="text-xs text-negative-foreground">{errors.name.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-desc">설명</Label>
            <Textarea id="cat-desc" rows={2} {...form.register('description')} />
            {errors.description && (
              <p className="text-xs text-negative-foreground">{errors.description.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-sort">정렬 순서</Label>
              <Input
                id="cat-sort"
                type="number"
                inputMode="numeric"
                {...form.register('sortOrder', { valueAsNumber: true })}
              />
              {errors.sortOrder ? (
                <p className="text-xs text-negative-foreground">{errors.sortOrder.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">숫자가 작을수록 앞에 보입니다.</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-active">구매자 화면에 노출</Label>
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <Switch id="cat-active" checked={field.value} onCheckedChange={field.onChange} />
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
              {isSubmitting ? '저장 중…' : category ? '저장' : '추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
