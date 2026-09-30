import { useState } from 'react';
import { toast } from 'sonner';

import { type AccountStatus } from '@/graphql/generated/graphql';
import { messageFor } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
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

import { reinstateAccount, suspendAccount } from '../api/queries';

const REASON_MAX = 500;

interface Props {
  accountId: string;
  status: AccountStatus;
  /** 표시용 이름(토스트) */
  label: string;
  /** 성공 뒤 호출자의 캐시 무효화 */
  onChanged: () => Promise<void> | void;
}

/** USER·SELLER 공용 정지/정지 해제. 정지는 사유 필수(감사 로그), 해제는 확인만. */
export function AccountStatusActions({ accountId, status, label, onChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const trimmed = reason.trim();

  if (status === 'SUSPENDED') {
    return (
      <ConfirmDialog
        trigger={<Button variant="outline">정지 해제</Button>}
        title={`${label} 계정의 정지를 해제할까요?`}
        description="다시 로그인해 이용할 수 있게 됩니다."
        confirmLabel="정지 해제"
        onConfirm={async () => {
          try {
            await reinstateAccount(accountId);
            await onChanged();
            toast.success(`${label} 계정의 정지를 해제했습니다.`);
          } catch (e) {
            toast.error(messageFor(e));
            throw e;
          }
        }}
      />
    );
  }

  const submit = async () => {
    setBusy(true);
    try {
      await suspendAccount(accountId, trimmed);
      await onChanged();
      toast.success(`${label} 계정을 정지했습니다.`);
      setOpen(false);
      setReason('');
    } catch (e) {
      toast.error(messageFor(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-negative text-negative-foreground">
          계정 정지
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label} 계정을 정지할까요?</DialogTitle>
          <DialogDescription>
            즉시 로그아웃되고 앱·판매자 센터를 이용할 수 없게 됩니다. 사유는 감사 로그에 남습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="suspend-reason">정지 사유 (필수)</Label>
          <Textarea
            id="suspend-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={REASON_MAX + 50}
          />
          <span
            className={`text-xs tabular-nums ${trimmed.length > REASON_MAX ? 'text-negative-foreground' : 'text-muted-foreground'}`}
          >
            {trimmed.length} / {REASON_MAX}
          </span>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
            닫기
          </Button>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={busy || trimmed.length === 0 || trimmed.length > REASON_MAX}
          >
            {busy ? '정지 중…' : '계정 정지'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
