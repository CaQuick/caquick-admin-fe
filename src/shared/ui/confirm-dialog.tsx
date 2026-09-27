import { type ReactNode, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog';
import { buttonVariants } from '@/shared/ui/button';

interface Props {
  trigger: ReactNode;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  /** reject되면 다이얼로그를 유지한다. 오류 안내(토스트)는 onConfirm 안에서 호출자가 한다. */
  onConfirm: () => Promise<void> | void;
}

/** 되돌리기 어려운 작업(취소·삭제·정지) 앞의 확인. 진행 중에는 버튼을 잠근다. */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = '확인',
  destructive = false,
  onConfirm,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>취소</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            className={destructive ? buttonVariants({ variant: 'destructive' }) : undefined}
            onClick={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await onConfirm();
                setOpen(false);
              } catch {
                // 열린 채 둔다 — 호출자가 이미 알렸다
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? '처리 중…' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
