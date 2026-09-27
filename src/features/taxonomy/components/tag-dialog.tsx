import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
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

import { tagMutations } from '../api/queries';
import { type TagFormValues, tagFormSchema } from '../schemas';

interface Props {
  trigger: ReactNode;
  tag?: { id: string; name: string };
}

export function TagDialog({ trigger, tag }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: { name: tag?.name ?? '' },
  });
  const { errors, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (v) => {
    setError(null);
    try {
      if (tag) await tagMutations.update(qc, { tagId: tag.id, name: v.name });
      else await tagMutations.create(qc, { name: v.name });
      toast.success(
        tag ? `태그를 ${v.name}(으)로 수정했습니다.` : `${v.name} 태그를 만들었습니다.`,
      );
      setOpen(false);
      form.reset({ name: tag ? v.name : '' });
    } catch (e) {
      setError(messageFor(e));
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) form.reset({ name: tag?.name ?? '' });
        setError(null);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{tag ? '태그 수정' : '태그 추가'}</DialogTitle>
            <DialogDescription>
              이름은 전체에서 유일합니다. 삭제된 같은 이름이 있으면 복구됩니다.
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
            <Label htmlFor="tag-name">이름</Label>
            <Input id="tag-name" aria-invalid={!!errors.name} {...form.register('name')} />
            {errors.name && (
              <p className="text-xs text-negative-foreground">{errors.name.message}</p>
            )}
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
              {isSubmitting ? '저장 중…' : tag ? '저장' : '추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
