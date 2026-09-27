import { type AdminOrderQuery } from '@/graphql/generated/graphql';
import { formatKrw } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { cn } from '@/shared/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { StatusPill } from '@/shared/ui/status-pill';

import { ORDER_STATUS, orderStatusMeta } from '../status';

export type OrderDetail = AdminOrderQuery['adminOrder'];

const STEPS = ORDER_STATUS.filter((s) => s.value !== 'CANCELED');
const STEP_AT: Record<string, keyof OrderDetail> = {
  SUBMITTED: 'submittedAt',
  CONFIRMED: 'confirmedAt',
  MADE: 'madeAt',
  PICKED_UP: 'pickedUpAt',
};

export function OrderProgress({ order }: { order: OrderDetail }) {
  const canceled = order.status === 'CANCELED';
  const currentIdx = STEPS.findIndex((s) => s.value === order.status);
  return (
    <Card>
      <CardHeader className="flex-row items-baseline gap-2">
        <CardTitle className="text-sm">진행 상태</CardTitle>
        <span className="text-xs text-muted-foreground">
          픽업 예정 {formatKst(order.pickupAt, true)}
        </span>
      </CardHeader>
      <CardContent>
        {canceled && (
          <p className="mb-3 text-sm font-medium text-negative-foreground">
            취소됨 · {order.canceledAt ? formatKst(order.canceledAt, true) : ''}
          </p>
        )}
        <ol className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
          {STEPS.map((s, i) => {
            const at = order[STEP_AT[s.value]!] as string | null;
            const done = at !== null;
            const now = i === currentIdx && !canceled;
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
      </CardContent>
    </Card>
  );
}

export function OrderItems({ order }: { order: OrderDetail }) {
  return (
    <Card>
      <CardHeader className="flex-row items-baseline gap-2">
        <CardTitle className="text-sm">주문 상품</CardTitle>
        <span className="text-xs text-muted-foreground">
          주문 시점 스냅샷 · {order.items.length}개
        </span>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="divide-y divide-divider">
          {order.items.map((it) => (
            <li key={it.id} className="grid grid-cols-[1fr_auto] gap-3 py-3">
              <div className="min-w-0">
                <div className="font-semibold">
                  {it.productName}{' '}
                  <span className="font-normal text-muted-foreground">× {it.quantity}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  매장 #{it.storeId} · 상품 #{it.productId} · 정가 {formatKrw(it.regularPrice)}
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
                {it.customTexts.length > 0 && (
                  <div className="mt-1 text-xs">
                    {it.customTexts.map((c) => (
                      <span key={c.id} className="mr-3">
                        문구 “{c.valueText}”
                        <span className="text-muted-foreground"> (기본 {c.defaultText})</span>
                      </span>
                    ))}
                  </div>
                )}
                {it.freeEdits.length > 0 && (
                  <ul className="mt-1.5 flex flex-wrap gap-2">
                    {it.freeEdits.map((f) => (
                      <li key={f.id} className="flex items-center gap-2 text-xs">
                        <a href={f.cropImageUrl} target="_blank" rel="noreferrer" className="block">
                          <img
                            src={f.cropImageUrl}
                            alt={`자유 편집 ${f.sortOrder + 1}`}
                            className="size-12 rounded-md border object-cover"
                          />
                        </a>
                        <span className="max-w-48 truncate">{f.descriptionText}</span>
                        {f.attachments.length > 0 && (
                          <span className="text-muted-foreground">첨부 {f.attachments.length}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
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
            <span>{b.nickname ?? '(탈퇴)'}</span>
            <StatusPill
              tone={
                b.status === 'ACTIVE'
                  ? 'positive'
                  : b.status === 'SUSPENDED'
                    ? 'negative'
                    : 'neutral'
              }
            >
              {b.status}
            </StatusPill>
          </dd>
          <dt className="text-muted-foreground">이메일</dt>
          <dd className="break-all">{b.email ?? '—'}</dd>
          <dt className="text-muted-foreground">계정 ID</dt>
          <dd className="font-mono">{b.accountId}</dd>
        </dl>
      </CardContent>
    </Card>
  );
}

export function OrderHistory({ order }: { order: OrderDetail }) {
  return (
    <Card>
      <CardHeader className="flex-row items-baseline gap-2">
        <CardTitle className="text-sm">상태 이력</CardTitle>
        <span className="text-xs text-muted-foreground">최신순</span>
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
                <div>
                  {h.fromStatus ? orderStatusMeta(h.fromStatus).label : '—'} →{' '}
                  <b>{orderStatusMeta(h.toStatus).label}</b>
                </div>
                <div className="text-muted-foreground tabular-nums">
                  {formatKst(h.changedAt, true)}
                </div>
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
