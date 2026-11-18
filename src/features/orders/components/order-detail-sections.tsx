import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { AccountStatusPill, BuyerRef } from '@/features/accounts';
import { type AdminOrderQuery, type OrderStatusType } from '@/graphql/generated/graphql';
import { formatKrw } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

import { storeRefQueryOptions } from '../api/queries';
import { autoTransitionNote } from '../auto-transition';
import { actorLabel, cancelFaultLabel, cancelReasonLabel } from '../meta';
import { ORDER_STATUS, orderStatusMeta } from '../status';
import { OrderItemCustom } from './order-item-custom';

export type OrderDetail = AdminOrderQuery['adminOrder'];

const STEP_AT: Partial<Record<OrderStatusType, keyof OrderDetail>> = {
  PENDING_PAYMENT: 'createdAt',
  SUBMITTED: 'submittedAt',
  CONFIRMED: 'confirmedAt',
  MADE: 'madeAt',
  PICKED_UP: 'pickedUpAt',
};
const STEPS = ORDER_STATUS.filter((s) => s.value in STEP_AT);
const ENDED: Partial<Record<OrderStatusType, { label: string; at: keyof OrderDetail }>> = {
  CANCELED: { label: '취소됨', at: 'canceledAt' },
  NO_SHOW: { label: '노쇼', at: 'noShowAt' },
};

export function OrderProgress({ order }: { order: OrderDetail }) {
  const storeId = order.items[0]?.storeId;
  const store = useQuery({
    ...storeRefQueryOptions(storeId ?? ''),
    enabled: storeId !== undefined,
  });
  // 결제 도입 전 주문은 접수에서 시작했다
  const steps = order.payment ? STEPS : STEPS.slice(1);
  const ended = ENDED[order.status];
  const endedAt = ended && (order[ended.at] as string | null);
  const currentIdx = steps.findIndex((s) => s.value === order.status);
  const note = autoTransitionNote(order, store.data?.isActive === false);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">진행 상태</CardTitle>
        <CardDescription className="text-xs">
          픽업 예정 {formatKst(order.pickupAt, true)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {ended && (
          <p className="mb-3 text-sm font-medium text-negative-foreground">
            {ended.label} · {endedAt ? formatKst(endedAt, true) : ''}
          </p>
        )}
        <ol className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
          {steps.map((s, i) => {
            const at = order[STEP_AT[s.value]!] as string | null;
            const done = at !== null;
            const now = i === currentIdx;
            return (
              <li
                key={s.value}
                className={cn(
                  'flex items-center gap-2',
                  done ? 'text-foreground' : 'text-muted-foreground',
                  now && 'font-semibold',
                )}
              >
                <span
                  className={cn(
                    'size-2.5 rounded-full border-2',
                    done ? 'border-primary bg-primary' : 'border-border',
                  )}
                  aria-hidden
                />
                {s.label}
                {at && (
                  <span className="font-normal text-muted-foreground tabular-nums">
                    {formatKst(at)}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        {note && (
          <p
            role="note"
            aria-label="자동 처리 예정"
            className="mt-3 rounded-md bg-surface-tint px-3 py-2 text-xs text-muted-foreground"
          >
            {note}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/** 품목에는 매장명 스냅샷이 없어 현재 매장 이름을 불러 보인다. 못 불러오면 #ID */
function StoreLink({ storeId }: { storeId: string }) {
  const store = useQuery(storeRefQueryOptions(storeId));
  return (
    <Link
      to="/stores/$storeId"
      params={{ storeId }}
      className="text-primary-soft-foreground hover:underline"
    >
      매장 {store.data?.storeName ?? `#${storeId}`}
    </Link>
  );
}

export function OrderItems({ order }: { order: OrderDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">주문 상품</CardTitle>
        <CardDescription className="text-xs">
          주문 당시 정보 · {order.items.length}개
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="divide-y divide-divider">
          {order.items.map((it) => (
            <li key={it.id} className="grid grid-cols-[1fr_auto] gap-3 py-3">
              <div className="min-w-0">
                <div className="font-semibold">
                  <Link
                    to="/products/$productId"
                    params={{ productId: it.productId }}
                    className="hover:underline"
                  >
                    {it.productName}
                  </Link>{' '}
                  <span className="font-normal text-muted-foreground">× {it.quantity}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <StoreLink storeId={it.storeId} /> · 정가 {formatKrw(it.regularPrice)}
                  {it.salePrice !== null && ` · 판매가 ${formatKrw(it.salePrice)}`}
                </div>
                {it.optionItems.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs">
                    {it.optionItems.map((o) => (
                      <span key={o.id}>
                        {o.groupName}: {o.optionTitle}
                        {o.priceDelta !== 0 && (
                          <span className="text-muted-foreground tabular-nums">
                            {' '}
                            ({o.priceDelta > 0 ? '+' : ''}
                            {formatKrw(o.priceDelta)})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                <OrderItemCustom item={it} />
              </div>
              <div className="text-right font-semibold tabular-nums">
                {formatKrw(it.itemSubtotalPrice)}
              </div>
            </li>
          ))}
        </ul>
        <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-t border-dashed pt-3 text-sm tabular-nums">
          <dt className="text-muted-foreground">상품 합계</dt>
          <dd className="text-right">{formatKrw(order.subtotalPrice)}</dd>
          <dt className="text-muted-foreground">할인</dt>
          <dd className="text-right">-{formatKrw(order.discountPrice)}</dd>
          <dt className="font-bold">결제 금액</dt>
          <dd className="text-right text-base font-bold">{formatKrw(order.totalPrice)}</dd>
        </dl>
      </CardContent>
    </Card>
  );
}

export function OrderBuyer({ order }: { order: OrderDetail }) {
  const b = order.buyer;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">구매자</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-[80px_1fr] gap-x-3 gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">주문자</dt>
          <dd>
            {order.buyerName} · {order.buyerPhone}
          </dd>
          <dt className="text-muted-foreground">계정</dt>
          <dd className="flex flex-wrap items-center gap-2">
            <BuyerRef
              accountId={b.accountId}
              nickname={b.nickname}
              className="text-primary-soft-foreground"
            />
            <AccountStatusPill status={b.status} />
          </dd>
          <dt className="text-muted-foreground">이메일</dt>
          <dd className="break-all">{b.email ?? '—'}</dd>
          <dt className="text-muted-foreground">계정 ID</dt>
          <dd>
            <BuyerRef
              accountId={b.accountId}
              nickname={b.nickname}
              badge={false}
              className="font-mono text-primary-soft-foreground"
            >
              {b.accountId}
            </BuyerRef>
          </dd>
        </dl>
      </CardContent>
    </Card>
  );
}

export function OrderHistory({ order }: { order: OrderDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">상태 이력</CardTitle>
        <CardDescription className="text-xs">최신순</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-2 text-xs">
          {order.statusHistories.map((h, i) => (
            <li key={h.id} className="grid grid-cols-[10px_1fr] gap-2.5">
              <span
                className={cn('mt-1 size-2 rounded-full', i === 0 ? 'bg-primary' : 'bg-border')}
                aria-hidden
              />
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span>
                    {h.fromStatus ? orderStatusMeta(h.fromStatus).label : '—'} →{' '}
                    <b>{orderStatusMeta(h.toStatus).label}</b>
                  </span>
                  <Badge variant="outline">{actorLabel(h.actorType)}</Badge>
                </div>
                <div className="text-muted-foreground tabular-nums">
                  {formatKst(h.changedAt, true)}
                </div>
                {h.cancelReason && (
                  <div>
                    사유 {cancelReasonLabel(h.cancelReason)}
                    {h.cancelFault && ` · ${cancelFaultLabel(h.cancelFault)}`}
                    {h.refundAmount !== null && ` · 환불 ${formatKrw(h.refundAmount)}`}
                  </div>
                )}
                {h.note && (
                  <div className="mt-1 inline-block rounded-md bg-surface-tint px-2 py-1">
                    {h.note}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export function OrderRequestNote({ note }: { note: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">요청 사항</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm break-words whitespace-pre-wrap">{note}</p>
      </CardContent>
    </Card>
  );
}

/** 판매자 픽업 일시 변경 이력. 오래된 순 */
export function OrderPickupChanges({ changes }: { changes: OrderDetail['pickupChanges'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">픽업 일시 변경</CardTitle>
        <CardDescription className="text-xs">판매자 변경 · {changes.length}건</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-2 text-xs">
          {changes.map((c) => (
            <li key={c.id}>
              <div className="tabular-nums">
                {formatKst(c.fromPickupAt, true)} → <b>{formatKst(c.toPickupAt, true)}</b>
              </div>
              <div className="text-muted-foreground tabular-nums">
                변경 {formatKst(c.changedAt, true)}
              </div>
              {c.note && (
                <div className="mt-1 inline-block rounded-md bg-surface-tint px-2 py-1">
                  {c.note}
                </div>
              )}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
