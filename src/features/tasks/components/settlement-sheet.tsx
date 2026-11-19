import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { MarkPaidDialog } from '@/features/settlements';
import { formatCount, formatKrw } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { Button } from '@/shared/ui/button';

import { type SettlementDetail, settlementQueryOptions } from '../api/queries';
import { loadDescription } from '../meta';
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
  const account = s.currentAccount;

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
          {account ? (
            <MarkPaidDialog
              settlementId={s.id}
              payoutAmount={s.payoutAmount}
              account={{
                bankName: account.bank.name,
                accountNumber: account.accountNumber,
                accountHolder: account.accountHolder,
              }}
            />
          ) : (
            <Button disabled>송금 완료</Button>
          )}
        </div>
      )}
    </>
  );
}
