import { type ReactNode, useState } from 'react';

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
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

interface Props {
  trigger: ReactNode;
  title: string;
  description?: ReactNode;
  reasonLabel?: string;
  /** false면 사유를 비워도 된다 */
  reasonRequired?: boolean;
  maxLength?: number;
  confirmLabel: string;
  destructive?: boolean;
  /** reject면 열린 채 둔다. 오류 안내는 호출자가 한다 */
  onConfirm: (reason: string) => Promise<void>;
}

/** 사유(감사 로그)를 받는 확인 다이얼로그 — 정지·취소·활성 전환 등에 공용. */
export function ReasonDialog({
  trigger,
  title,
  description,
  reasonLabel = '사유',
  reasonRequired = true,
  maxLength = 500,
  confirmLabel,
  destructive = false,
  onConfirm,
}: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const trimmed = reason.trim();
  const invalid = (reasonRequired && trimmed.length === 0) || trimmed.length > maxLength;
  const submit = async () => {
    setBusy(true);
    try {
      await onConfirm(trimmed);
      setOpen(false);
      setReason('');
    } catch {
      // 열린 채 둔다
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reason-dialog-input">
            {reasonLabel}
            {reasonRequired ? ' (필수)' : ' (선택)'}
          </Label>
          <Textarea
            id="reason-dialog-input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={maxLength + 50}
          />
          <span
            className={`text-xs tabular-nums ${trimmed.length > maxLength ? 'text-negative-foreground' : 'text-muted-foreground'}`}
          >
            {trimmed.length} / {maxLength}
          </span>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
            닫기
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={submit}
            disabled={busy || invalid}
          >
            {busy ? '처리 중…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
