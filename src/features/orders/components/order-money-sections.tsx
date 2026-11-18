import { type ReactNode } from 'react';

import { formatKrw } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { StatusPill } from '@/shared/ui/status-pill';

import {
  actorLabel,
  cancelFaultLabel,
  confirmSourceLabel,
  formatBps,
  paymentMethodLabel,
  paymentStatusMeta,
  refundKindLabel,
  refundStatusMeta,
} from '../meta';
import { type OrderDetail } from './order-detail-sections';

type Row = [label: string, value: ReactNode];

/** 조건이 false인 줄은 빼고 보인다 */
function Rows({ rows }: { rows: (Row | false)[] }) {
  return (
    <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-1.5 text-sm">
      {rows
        .filter((r): r is Row => r !== false)
        .map(([label, value]) => [
          <dt key={`${label}-t`} className="text-muted-foreground">
            {label}
          </dt>,
          <dd key={`${label}-d`} className="min-w-0 break-words tabular-nums">
            {value}
          </dd>,
        ])}
    </dl>
  );
}

const time = (iso: string | null) => (iso ? formatKst(iso, true) : '—');
// 목록·카드에서는 끝 4자리만 보인다(계좌번호 표시 규칙)
const maskAccount = (num: string) => `****${num.slice(-4)}`;

function MoneyCard({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        {caption && <CardDescription className="text-xs">{caption}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function OrderPayment({ payment }: { payment: OrderDetail['payment'] }) {
  if (!payment) {
    return (
      <MoneyCard title="결제">
        <p className="text-sm text-muted-foreground">결제 도입 전 주문이라 결제 기록이 없습니다.</p>
      </MoneyCard>
    );
  }
  const status = paymentStatusMeta(payment.status);
  const confirmedBy = [
    payment.confirmSource && confirmSourceLabel(payment.confirmSource),
    payment.confirmedByLabel,
  ].filter(Boolean);
  return (
    <MoneyCard title="결제" caption={paymentMethodLabel(payment.method)}>
      <Rows
        rows={[
          ['상태', <StatusPill tone={status.tone}>{status.label}</StatusPill>],
          ['금액', formatKrw(payment.amount)],
          ['입금자명', payment.depositorName],
          [
            '입금 계좌',
            `${payment.depositBank.name} ${maskAccount(payment.depositAccountNumber)} · ${payment.depositAccountHolder}`,
          ],
          ['입금 기한', time(payment.expiresAt)],
          [
            '입금 알림',
            payment.buyerClaimedAt ? `${time(payment.buyerClaimedAt)} 구매자 '입금했어요'` : '—',
          ],
          [
            '확인 처리',
            payment.confirmedAt
              ? `${time(payment.confirmedAt)}${confirmedBy.length ? ` · ${confirmedBy.join(' · ')}` : ''}`
              : '—',
          ],
          payment.confirmNote !== null && ['확인 메모', payment.confirmNote],
        ]}
      />
    </MoneyCard>
  );
}

export function OrderCancellation({
  cancellation: c,
}: {
  cancellation: NonNullable<OrderDetail['cancellation']>;
}) {
  const refund = c.refundStatus && refundStatusMeta(c.refundStatus);
  return (
    <MoneyCard title="취소">
      <Rows
        rows={[
          ['취소 시각', time(c.canceledAt)],
          ['주체', actorLabel(c.actorType)],
          // reasonLabel은 BE가 붙여 모르는 사유 값도 읽힌다
          ['사유', c.reasonLabel],
          c.fault !== null && ['사정', cancelFaultLabel(c.fault)],
          [
            '환불 금액',
            <span className="flex flex-wrap items-center gap-1.5">
              {formatKrw(c.refundAmount)}
              {refund && <StatusPill tone={refund.tone}>{refund.label}</StatusPill>}
            </span>,
          ],
          c.refundCompletedAt !== null && ['환불 완료', time(c.refundCompletedAt)],
          c.note !== null && ['메모', <span className="whitespace-pre-wrap">{c.note}</span>],
        ]}
      />
    </MoneyCard>
  );
}

export function OrderRefunds({ refunds }: { refunds: OrderDetail['refunds'] }) {
  return (
    <MoneyCard title="환불" caption={`오래된 순 · ${refunds.length}건`}>
      <ul className="divide-y divide-divider">
        {refunds.map((r) => {
          const status = refundStatusMeta(r.status);
          return (
            <li key={r.id} className="flex flex-col gap-1 py-2.5 text-sm first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline">{refundKindLabel(r.kind)}</Badge>
                <b className="tabular-nums">{formatKrw(r.amount)}</b>
                <StatusPill tone={status.tone}>{status.label}</StatusPill>
              </div>
              <div className="text-xs text-muted-foreground">
                {r.bank && r.accountNumberMasked
                  ? `${r.bank.name} ${r.accountNumberMasked} · ${r.accountHolder ?? ''}`
                  : '환불 계좌 입력 전'}
              </div>
              <div className="text-xs text-muted-foreground tabular-nums">
                요청 {time(r.requestedAt)}
                {r.accountSubmittedAt && ` · 계좌 입력 ${time(r.accountSubmittedAt)}`}
                {r.completedAt && ` · 송금 ${time(r.completedAt)}`}
              </div>
            </li>
          );
        })}
      </ul>
    </MoneyCard>
  );
}

export function OrderSettlement({ order: o }: { order: OrderDetail }) {
  const finalized = o.settlementFinalizedAt !== null;
  const won = (n: number | null) => (n === null ? '—' : formatKrw(n));
  return (
    <MoneyCard
      title="정산"
      caption={finalized ? '확정됨' : '확정 전 금액은 결제 금액 기준 예상값입니다'}
    >
      <Rows
        rows={[
          ['수수료율', `${formatBps(o.commissionRateBps)} (주문 시점)`],
          [finalized ? '매장 지급액' : '정산 예정', won(o.expectedPayoutAmount)],
          finalized && ['수수료 기준액', won(o.settlementBaseAmount)],
          finalized && ['수수료', won(o.commissionAmount)],
          ['정산 확정', time(o.settlementFinalizedAt)],
          ['주간 정산', o.settlementId === null ? '묶이기 전' : `#${o.settlementId}`],
        ]}
      />
    </MoneyCard>
  );
}
