import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { orderStatusMeta } from '@/features/orders';
import { ApiError, messageFor } from '@/shared/api';
import { formatKrw } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { ReasonDialog } from '@/shared/ui/reason-dialog';
import { StatusPill } from '@/shared/ui/status-pill';
import { Textarea } from '@/shared/ui/textarea';

import { type TaskOrder, taskMutations, taskOrderQueryOptions } from '../api/queries';
import {
  type ConfirmPaymentValues,
  type DepositValues,
  confirmPaymentSchema,
  toConfirmPaymentInput,
  toDepositReturnInput,
} from '../forms';
import {
  actorLabel,
  isAmountInvalid,
  isAmountMismatch,
  isConflict,
  isPast,
  loadDescription,
  pickupTone,
} from '../meta';
import { parseWon } from '../search';
import { DepositDialog } from './deposit-dialog';
import { DoneSection, Field, Fields, TaskSheet, type NextTask } from './task-sheet';

const PICKUP_PASSED =
  '픽업 시각이 지난 주문은 입금 확인할 수 없어요. 미입금 취소 뒤 반환 대상으로 연결해 주세요.';

interface Props {
  /** 열린 주문 ID. undefined면 닫힌다 */
  orderId: string | undefined;
  /** 지금 목록 기준 다음 건 */
  next: (orderId: string) => NextTask;
  onOpen: (orderId: string | undefined) => void;
}

/** 입금 확인 대상 주문 1건. 주소(orderId)로 열려 경보 링크에서 바로 처리한다 */
export function DepositOrderSheet({ orderId, next, onOpen }: Props) {
  const q = useQuery({
    ...taskOrderQueryOptions(orderId ?? ''),
    enabled: orderId !== undefined,
  });
  const order = q.data;
  return (
    <TaskSheet
      open={orderId !== undefined}
      onClose={() => onOpen(undefined)}
      title={
        order ? (
          <>
            주문 {order.orderNumber}
            <StatusPill tone={orderStatusMeta(order.status).tone}>
              {orderStatusMeta(order.status).label}
            </StatusPill>
          </>
        ) : (
          '주문'
        )
      }
      description={loadDescription(
        q.isPending,
        q.isError ? q.error : null,
        order ? `${formatKst(order.createdAt, true)} 주문` : '',
      )}
    >
      {order && <OrderBody key={order.id} order={order} next={next(order.id)} onNext={onOpen} />}
    </TaskSheet>
  );
}

function doneInfo(order: TaskOrder): string {
  const p = order.payment;
  if (p?.status === 'CONFIRMED' && p.confirmedAt)
    return `입금 확인 · ${p.confirmedByLabel ?? '관리자'} · ${formatKst(p.confirmedAt, true)}`;
  const c = order.cancellation;
  if (c)
    return `취소 · ${actorLabel(c.actorType)} · ${c.reasonLabel} · ${formatKst(c.canceledAt, true)}`;
  return `입금 확인 대기 주문이 아닙니다(${orderStatusMeta(order.status).label}).`;
}

function OrderBody({
  order,
  next,
  onNext,
}: {
  order: TaskOrder;
  next: NextTask;
  onNext: (id: string) => void;
}) {
  const qc = useQueryClient();
  const [now] = useState(() => new Date());
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnDefaults, setReturnDefaults] = useState<{ amount?: string; notice?: string }>({});
  // 이번에 연결한 반환들의 환불. 시트가 모달이라 토스트 안 버튼은 누를 수 없어 시트 안에 둔다
  const [returnedRefundIds, setReturnedRefundIds] = useState<string[]>([]);
  const p = order.payment;
  const pending = order.status === 'PENDING_PAYMENT' && p?.status === 'PENDING';
  const tone = pickupTone(order.pickupAt, now);

  const openReturn = (amount?: string, notice?: string) => {
    setReturnDefaults({ amount, notice });
    setReturnOpen(true);
  };

  const submitReturn = async (v: DepositValues) => {
    const r = await taskMutations.createDepositReturn(qc, toDepositReturnInput(order.id, v));
    toast.success('반환 대상으로 연결했습니다. 구매자에게 환불 계좌 입력을 요청했어요.');
    if (r.refundId) setReturnedRefundIds((ids) => [...ids, r.refundId!]);
  };

  const cancelUnpaid = async (note: string) => {
    try {
      await taskMutations.cancelUnpaid(qc, order.id, note);
      toast.success(`${order.orderNumber} 주문을 미입금으로 취소했습니다.`);
    } catch (e) {
      toast.error(messageFor(e));
      // 그사이 처리됐으면 다시 읽은 상태를 보이도록 닫는다
      if (!isConflict(e)) throw e;
    }
  };

  return (
    <>
      <Fields>
        <Field label="상품">{order.items[0]?.productName ?? '-'}</Field>
        <Field label="결제 금액">{formatKrw(p?.amount ?? order.totalPrice)}</Field>
        <Field label="입금자명">{p?.depositorName ?? '-'}</Field>
        <Field label="주문자">
          {order.buyerName} · {order.buyerPhone}
        </Field>
        {p && (
          <Field label="입금 기한">
            {formatKst(p.expiresAt, true)}
            {pending && isPast(p.expiresAt, now) && (
              <StatusPill tone="negative" className="ml-2">
                기한 지남
              </StatusPill>
            )}
          </Field>
        )}
        {p && (
          <Field label="입금했어요">
            {p.buyerClaimedAt ? formatKst(p.buyerClaimedAt, true) : '누르지 않음'}
          </Field>
        )}
        <Field label="픽업 일시">
          {formatKst(order.pickupAt, true)}
          {pending && tone && (
            <StatusPill tone={tone} className="ml-2">
              {tone === 'negative' ? '픽업 지남' : '3시간 미만'}
            </StatusPill>
          )}
        </Field>
        <Field label="주문 상세">
          <Link
            to="/orders/$orderId"
            params={{ orderId: order.id }}
            className="text-primary-soft-foreground hover:underline"
          >
            주문 화면에서 보기
          </Link>
        </Field>
      </Fields>

      {pending ? (
        tone === 'negative' ? (
          <p role="note" className="rounded-md bg-negative-soft px-3 py-2 text-negative-foreground">
            {PICKUP_PASSED}
          </p>
        ) : (
          <ConfirmForm
            order={order}
            onMismatch={(amount, message) => openReturn(amount, message)}
          />
        )
      ) : (
        <DoneSection info={doneInfo(order)} next={next} onNext={onNext} />
      )}

      {returnedRefundIds.length > 0 && (
        <p className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
          반환 연결로 생긴 환불:
          {returnedRefundIds.map((refundId) => (
            <Link
              key={refundId}
              to="/tasks/refunds"
              search={{ refundId }}
              className="text-primary-soft-foreground hover:underline"
            >
              환불 #{refundId} 보기
            </Link>
          ))}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-3">
        {pending && (
          <ReasonDialog
            trigger={
              <Button variant="outline" className="border-negative text-negative-foreground">
                미입금 취소
              </Button>
            }
            title="미입금으로 취소할까요?"
            description={`${order.orderNumber} 주문을 미입금 사유로 취소합니다. 구매자에게 미입금 취소 알림이 가고, 이미 들어온 입금은 반환 대상으로 연결해 돌려줍니다.`}
            reasonLabel="메모"
            reasonRequired={false}
            confirmLabel="미입금 취소"
            destructive
            onConfirm={cancelUnpaid}
          />
        )}
        <Button variant="outline" onClick={() => openReturn()}>
          반환 대상으로 연결
        </Button>
      </div>

      <DepositDialog
        open={returnOpen}
        onOpenChange={setReturnOpen}
        title="반환 대상으로 연결"
        description={`은행 앱에서 본 입금을 ${order.orderNumber} 주문의 반환 대상으로 연결합니다. 입금액 전액의 환불이 생기고 구매자에게 환불 계좌 입력을 요청합니다. 주문 상태는 바뀌지 않습니다.`}
        notice={returnDefaults.notice}
        noteRequired={false}
        defaults={{ amount: returnDefaults.amount, depositorName: p?.depositorName ?? '' }}
        submitLabel="반환 대상으로 연결"
        onSubmit={submitReturn}
      />
    </>
  );
}

function ConfirmForm({
  order,
  onMismatch,
}: {
  order: TaskOrder;
  onMismatch: (amount: string, message: string) => void;
}) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ConfirmPaymentValues>({
    resolver: zodResolver(confirmPaymentSchema),
    defaultValues: { depositedAmount: '', note: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (v) => {
    setError(null);
    try {
      await taskMutations.confirmPayment(qc, toConfirmPaymentInput(order.id, v));
      toast.success(`${order.orderNumber} 입금을 확인했습니다. 판매자에게 새 주문으로 보입니다.`);
    } catch (e) {
      const message = messageFor(e);
      if (isAmountMismatch(e)) {
        setError(message);
        onMismatch(String(parseWon(v.depositedAmount)), message);
      } else if (isAmountInvalid(e)) {
        form.setError('depositedAmount', { type: 'server', message });
      } else if (e instanceof ApiError && e.classification === 'BAD_USER_INPUT') {
        setError(message);
      } else {
        toast.error(message);
      }
    }
  });

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-label="입금 확인"
      className="flex flex-col gap-3 rounded-lg border px-3.5 py-3"
    >
      <p className="text-muted-foreground">
        은행 앱에서 입금자명과 금액을 확인한 뒤 입금액을 입력하세요.
      </p>
      {error && (
        <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-negative-foreground">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm-amount">입금액(원) (필수)</Label>
        <Input
          id="confirm-amount"
          inputMode="numeric"
          aria-invalid={!!errors.depositedAmount}
          {...form.register('depositedAmount')}
        />
        {errors.depositedAmount && (
          <p className="text-xs text-negative-foreground">{errors.depositedAmount.message}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm-note">메모 (선택)</Label>
        <Textarea
          id="confirm-note"
          rows={2}
          aria-invalid={!!errors.note}
          {...form.register('note')}
        />
        {errors.note && <p className="text-xs text-negative-foreground">{errors.note.message}</p>}
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '확인 중…' : '입금 확인'}
        </Button>
      </div>
    </form>
  );
}
