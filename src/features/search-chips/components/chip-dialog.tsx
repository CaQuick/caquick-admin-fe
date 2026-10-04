import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

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

import { searchChipMutations } from '../api/queries';
import {
  type Chip,
  type ChipFormValues,
  EMPTY_CHIP,
  KEYWORD_MAX_LENGTH,
  chipFormSchema,
  chipSaveError,
  normalizeKeyword,
  toChipFormValues,
  toCreateChipInput,
  toUpdateChipInput,
} from '../schema';

interface Props {
  trigger: ReactNode;
  /** 있으면 수정, 없으면 추가 */
  chip?: Chip;
}

export function ChipDialog({ trigger, chip }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initial = chip ? toChipFormValues(chip) : EMPTY_CHIP;
  const form = useForm<ChipFormValues>({
    resolver: zodResolver(chipFormSchema),
    defaultValues: initial,
  });
  const { errors, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (v) => {
    setError(null);
    const keyword = normalizeKeyword(v.keyword);
    try {
      if (chip) {
        const input = toUpdateChipInput(chip.id, initial, v);
        if (input) {
          await searchChipMutations.update(qc, input);
          toast.success(`"${keyword}" 칩을 수정했습니다.`);
        }
      } else {
        await searchChipMutations.create(qc, toCreateChipInput(v));
        toast.success(`"${keyword}" 칩을 목록 맨 뒤에 추가했습니다.`);
      }
      setOpen(false);
    } catch (e) {
      const r = chipSaveError(e);
      if (r.notFound) {
        // 다시 받은 목록에서 행이 빠지면 이 다이얼로그도 함께 사라지므로 토스트로 알린다
        toast.error(r.message);
        setOpen(false);
        await searchChipMutations.refresh(qc);
        return;
      }
      if (r.field)
        form.setError(r.field, { type: 'server', message: r.message }, { shouldFocus: true });
      else setError(r.message);
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
            <DialogTitle>{chip ? '칩 수정' : '칩 추가'}</DialogTitle>
            <DialogDescription>
              {chip
                ? '바꾼 항목만 저장합니다. 기간을 비우면 그쪽 제한이 사라집니다.'
                : '새 칩은 목록 맨 뒤에 추가됩니다. 순서는 목록에서 바꿀 수 있습니다.'}
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
            <Label htmlFor="chip-keyword">
              키워드
              <span className="text-negative-foreground" aria-hidden>
                *
              </span>
            </Label>
            <Input
              id="chip-keyword"
              aria-required
              aria-invalid={!!errors.keyword}
              aria-describedby="chip-keyword-help"
              {...form.register('keyword')}
            />
            {errors.keyword && (
              <p className="text-xs text-negative-foreground">{errors.keyword.message}</p>
            )}
            <p id="chip-keyword-help" className="text-xs text-muted-foreground">
              1~{KEYWORD_MAX_LENGTH}자입니다. 앞뒤 공백은 지우고, 연속된 공백은 한 칸으로
              저장합니다.
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border px-3.5 py-3">
            <span className="flex flex-col gap-0.5">
              <Label htmlFor="chip-active">구매자 화면에 노출</Label>
              <span id="chip-active-help" className="text-xs text-muted-foreground">
                끄면 기간과 관계없이 숨깁니다.
              </span>
            </span>
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <Switch
                  id="chip-active"
                  aria-describedby="chip-active-help"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">
              노출 기간 <span className="font-normal text-muted-foreground">(선택, 한국 시간)</span>
            </legend>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <Label htmlFor="chip-starts" className="text-xs font-normal">
                  시작
                </Label>
                <Input id="chip-starts" type="datetime-local" {...form.register('startsAt')} />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="chip-ends" className="text-xs font-normal">
                  종료
                </Label>
                <Input
                  id="chip-ends"
                  type="datetime-local"
                  aria-invalid={!!errors.endsAt}
                  {...form.register('endsAt')}
                />
              </div>
            </div>
            {errors.endsAt && (
              <p className="text-xs text-negative-foreground">{errors.endsAt.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              비워 두면 그쪽 제한이 없습니다. 시작 시각부터 보이고, 종료 시각이 되면 자동으로
              숨겨집니다.
            </p>
          </fieldset>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중…' : chip ? '저장' : '추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
