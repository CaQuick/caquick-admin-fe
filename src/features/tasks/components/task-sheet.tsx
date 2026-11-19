import { type ReactNode } from 'react';

import { AccountNumber } from '@/features/settlements';
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

/** 송금할 계좌 전체 번호와 복사(정산 화면과 같은 AccountNumber) */
export function AccountToCopy({
  bankName,
  accountNumber,
  holder,
}: {
  bankName: string;
  accountNumber: string;
  holder: string;
}) {
  return (
    <span>
      {bankName} <AccountNumber value={accountNumber} /> ({holder})
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
