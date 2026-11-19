import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
import { formatKrw } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { Button } from '@/shared/ui/button';
import { ReasonDialog } from '@/shared/ui/reason-dialog';
import { StatusPill } from '@/shared/ui/status-pill';

import { type RefundDetail, refundQueryOptions, taskMutations } from '../api/queries';
import { isConflict, loadDescription, refundKindLabel, refundStatusMeta } from '../meta';
import { AccountToCopy, DoneSection, Field, Fields, TaskSheet, type NextTask } from './task-sheet';

interface Props {
  refundId: string | undefined;
  next: (refundId: string) => NextTask;
  onOpen: (refundId: string | undefined) => void;
}

/** 환불 1건. 송금할 계좌 전체 번호는 여기서만 보인다 */
export function RefundSheet({ refundId, next, onOpen }: Props) {
  const q = useQuery({ ...refundQueryOptions(refundId ?? ''), enabled: refundId !== undefined });
  const r = q.data?.refund;
  const status = r ? refundStatusMeta(r.status) : null;
  return (
    <TaskSheet
      open={refundId !== undefined}
      onClose={() => onOpen(undefined)}
      title={
        r && status ? (
          <>
            {refundKindLabel(r.kind)} {formatKrw(r.amount)}
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
          </>
        ) : (
          '환불'
        )
      }
      description={loadDescription(
        q.isPending,
        q.isError ? q.error : null,
        r ? `주문 ${r.orderNumber} · ${formatKst(r.requestedAt, true)} 요청` : '',
      )}
    >
      {q.data && <RefundBody detail={q.data} next={next(q.data.refund.id)} onNext={onOpen} />}
    </TaskSheet>
  );
}

function RefundBody({
  detail,
  next,
  onNext,
}: {
  detail: RefundDetail;
  next: NextTask;
  onNext: (id: string) => void;
}) {
  const qc = useQueryClient();
  const { refund: r, accountNumber, depositRecord } = detail;
  const ready = r.status === 'AWAITING_TRANSFER' && r.bank && r.accountHolder && accountNumber;

  const complete = async (note: string) => {
    try {
      await taskMutations.completeRefund(qc, r.id, note);
      toast.success(`${formatKrw(r.amount)} 환불을 송금 완료로 처리했습니다.`);
    } catch (e) {
      toast.error(messageFor(e));
      if (!isConflict(e)) throw e;
    }
  };

  return (
    <>
      <Fields>
        <Field label="주문">
          <Link
            to="/orders/$orderId"
            params={{ orderId: r.orderId }}
            className="text-primary-soft-foreground hover:underline"
          >
            {r.orderNumber}
          </Link>
          {r.productName && <span className="text-muted-foreground"> · {r.productName}</span>}
        </Field>
        {r.storeName && <Field label="매장">{r.storeName}</Field>}
        <Field label="주문자">
          {r.buyerName} · {r.buyerPhone}
        </Field>
        <Field label="환불 계좌">
          {r.bank && r.accountHolder && accountNumber ? (
            <AccountToCopy
              bankName={r.bank.name}
              accountNumber={accountNumber}
              holder={r.accountHolder}
            />
          ) : (
            '구매자가 아직 입력하지 않았습니다.'
          )}
        </Field>
        {r.accountSubmittedAt && (
          <Field label="계좌 입력">{formatKst(r.accountSubmittedAt, true)}</Field>
        )}
        {depositRecord && (
          <Field label="입금 기록">
            {depositRecord.depositorName}
            {depositRecord.depositedAt && ` · ${formatKst(depositRecord.depositedAt, true)}`}
            {depositRecord.note && (
              <p className="text-xs whitespace-pre-line text-muted-foreground">
                {depositRecord.note}
              </p>
            )}
          </Field>
        )}
      </Fields>

      {r.status === 'COMPLETED' ? (
        <DoneSection
          info={[
            `송금 완료 · ${r.completedByLabel ?? '관리자'}`,
            r.completedAt && formatKst(r.completedAt, true),
            r.completeNote,
          ]
            .filter(Boolean)
            .join(' · ')}
          next={next}
          onNext={onNext}
        />
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-3">
          {!ready && (
            <span className="text-xs text-muted-foreground">
              계좌 입력 전이라 송금할 수 없어요. 구매자에게 연락해 계좌 입력을 요청하세요.
            </span>
          )}
          <ReasonDialog
            trigger={<Button disabled={!ready}>송금 완료</Button>}
            title="송금 완료로 처리할까요?"
            description={
              ready
                ? `${r.bank!.name} ${accountNumber}(${r.accountHolder})로 ${formatKrw(r.amount)}을 송금했나요?`
                : undefined
            }
            reasonLabel="메모"
            reasonRequired={false}
            confirmLabel="송금 완료"
            onConfirm={complete}
          />
        </div>
      )}
    </>
  );
}
