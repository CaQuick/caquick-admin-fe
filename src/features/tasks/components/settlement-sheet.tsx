import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
import { formatCount, formatKrw } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { Button } from '@/shared/ui/button';
import { ReasonDialog } from '@/shared/ui/reason-dialog';

import { type SettlementDetail, settlementQueryOptions, taskMutations } from '../api/queries';
import { isConflict, loadDescription } from '../meta';
import { AccountToCopy, DoneSection, Field, Fields, TaskSheet, type NextTask } from './task-sheet';

interface Props {
  settlementId: string | undefined;
  next: (settlementId: string) => NextTask;
  onOpen: (settlementId: string | undefined) => void;
}

export function StoreAccountLink({ storeId }: { storeId: string }) {
  return (
    <Link
      to="/stores/$storeId"
      params={{ storeId }}
      className="text-primary-soft-foreground hover:underline"
    >
      매장에서 정산 계좌 등록
    </Link>
  );
}

/** 주간 정산 1건의 송금. 지금 매장 정산 계좌 전체 번호는 여기서만 보인다 */
export function SettlementSheet({ settlementId, next, onOpen }: Props) {
  const q = useQuery({
    ...settlementQueryOptions(settlementId ?? ''),
    enabled: settlementId !== undefined,
  });
  const s = q.data;
  return (
    <TaskSheet
      open={settlementId !== undefined}
      onClose={() => onOpen(undefined)}
      title={s ? `${s.storeName} 정산 ${formatKrw(s.payoutAmount)}` : '정산'}
      description={loadDescription(
        q.isPending,
        q.isError ? q.error : null,
        s ? `${s.periodStart} ~ ${s.periodEnd}` : '',
      )}
    >
      {s && <SettlementBody s={s} next={next(s.id)} onNext={onOpen} />}
    </TaskSheet>
  );
}

function SettlementBody({
  s,
  next,
  onNext,
}: {
  s: SettlementDetail;
  next: NextTask;
  onNext: (id: string) => void;
}) {
  const qc = useQueryClient();
  const account = s.currentAccount;

  const markPaid = async (note: string) => {
    try {
      await taskMutations.markSettlementPaid(qc, s.id, note);
      toast.success(`${s.storeName} 정산을 송금 완료로 처리했습니다.`);
    } catch (e) {
      toast.error(messageFor(e));
      if (!isConflict(e)) throw e;
    }
  };

  return (
    <>
      <Fields>
        <Field label="주문">{formatCount(s.orderCount)}건</Field>
        <Field label="기준액">{formatKrw(s.settlementBaseAmount)}</Field>
        <Field label="수수료">{formatKrw(s.commissionAmount)}</Field>
        <Field label="송금액">
          <span className="font-semibold">{formatKrw(s.payoutAmount)}</span>
        </Field>
        <Field label="정산 계좌">
          {account ? (
            <AccountToCopy
              bankName={account.bank.name}
              accountNumber={account.accountNumber}
              holder={account.accountHolder}
            />
          ) : (
            <span className="flex flex-col gap-0.5">
              등록된 정산 계좌가 없습니다.
              <StoreAccountLink storeId={s.storeId} />
            </span>
          )}
        </Field>
      </Fields>

      {s.status === 'PAID' ? (
        <DoneSection
          info={[
            `송금 완료 · ${s.paidByLabel ?? '관리자'}`,
            s.paidAt && formatKst(s.paidAt, true),
            s.paidAccount &&
              `${s.paidAccount.bank.name} ${s.paidAccount.accountNumberMasked}(${s.paidAccount.accountHolder})`,
            s.paidNote,
          ]
            .filter(Boolean)
            .join(' · ')}
          next={next}
          onNext={onNext}
        />
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-3">
          {!account && (
            <span className="text-xs text-muted-foreground">
              정산 계좌가 없어 송금 완료로 처리할 수 없어요.
            </span>
          )}
          <ReasonDialog
            trigger={<Button disabled={!account}>송금 완료</Button>}
            title="송금 완료로 처리할까요?"
            description={
              account
                ? `${account.bank.name} ${account.accountNumber}(${account.accountHolder})로 ${formatKrw(s.payoutAmount)}을 송금했나요?`
                : undefined
            }
            reasonLabel="메모"
            reasonRequired={false}
            confirmLabel="송금 완료"
            onConfirm={markPaid}
          />
        </div>
      )}
    </>
  );
}
