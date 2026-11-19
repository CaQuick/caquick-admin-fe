import { CopyIcon } from 'lucide-react';
import { type ReactNode } from 'react';
import { toast } from 'sonner';

import { copyText } from '@/shared/lib/clipboard';
import { formatCount } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';

interface ShellProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** 읽기 상태 문구. 데이터가 있으면 부르는 쪽이 요약을 준다 */
  description: string;
  children?: ReactNode;
}

export function TaskSheet({ open, onClose, title, description, children }: ShellProps) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="pr-10">
          <SheetTitle className="flex flex-wrap items-center gap-2 break-words">{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        {children && <div className="flex flex-col gap-4 px-4 pb-6 text-sm">{children}</div>}
      </SheetContent>
    </Sheet>
  );
}

export function Fields({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-1.5 tabular-nums">{children}</dl>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </>
  );
}

/** 송금할 계좌 전체 번호와 복사. 번호는 화면에만 두고 알림 문구에 넣지 않는다 */
export function AccountToCopy({
  bankName,
  accountNumber,
  holder,
}: {
  bankName: string;
  accountNumber: string;
  holder: string;
}) {
  const copy = async () => {
    if (await copyText(accountNumber)) toast.success('계좌번호를 복사했습니다.');
    else toast.error('복사하지 못했습니다. 계좌번호를 직접 옮겨 적어 주세요.');
  };
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span>
        {bankName} <span className="font-mono">{accountNumber}</span> ({holder})
      </span>
      <Button type="button" variant="outline" size="xs" onClick={copy}>
        <CopyIcon className="size-3" aria-hidden /> 계좌번호 복사
      </Button>
    </span>
  );
}

export type NextTask = { nextId: string | null; remaining: number } | null;

/** 처리가 끝난 건: 누가 언제 처리했는지와 [다음 건]. next가 null이면 처리할 목록 밖에서 연 것이다 */
export function DoneSection({
  info,
  next,
  onNext,
}: {
  info: ReactNode;
  next: NextTask;
  onNext: (id: string) => void;
}) {
  return (
    <section className="flex flex-col gap-3 border-t pt-3">
      <div role="status" className="rounded-md bg-positive-soft px-3 py-2 text-positive-foreground">
        <p className="font-semibold">처리됨</p>
        <p className="text-xs">{info}</p>
      </div>
      {next && (
        <div className="flex items-center justify-end gap-2">
          {next.nextId ? (
            <Button type="button" onClick={() => onNext(next.nextId!)}>
              다음 건 ({formatCount(next.remaining)}건 남음)
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              {next.remaining > 0 ? '다음 건은 목록에서 골라 주세요.' : '남은 건이 없습니다.'}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
