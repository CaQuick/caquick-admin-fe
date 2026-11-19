import {
  type AdminTaskCountsQuery,
  type DepositRecordKindType,
  type OrderActorType,
  type RefundKindType,
  type RefundStatusType,
} from '@/graphql/generated/graphql';
import { ApiError, messageFor } from '@/shared/api';
import { type PillTone } from '@/shared/ui/status-pill';

// Record라 codegen enum에 값이 늘면 tsc가 잡는다. 모르는 값은 원문으로 보인다
const REFUND_KIND: Record<RefundKindType, string> = {
  CANCEL: '취소 환불',
  DEPOSIT_RETURN: '입금 반환',
};
const REFUND_STATUS: Record<RefundStatusType, { label: string; tone: PillTone }> = {
  AWAITING_ACCOUNT: { label: '계좌 입력 대기', tone: 'neutral' },
  AWAITING_TRANSFER: { label: '송금 대기', tone: 'caution' },
  COMPLETED: { label: '송금 완료', tone: 'positive' },
};
const RECORD_KIND: Record<DepositRecordKindType, string> = {
  RETURN: '반환',
  UNIDENTIFIED: '종결',
};
const ACTOR: Record<OrderActorType, string> = {
  BUYER: '구매자',
  SELLER: '판매자',
  ADMIN: '관리자',
  SYSTEM: '자동',
};

const label = (table: Record<string, string>, value: string) =>
  Object.hasOwn(table, value) ? table[value]! : value;

export const REFUND_KINDS = (Object.keys(REFUND_KIND) as RefundKindType[]).map((value) => ({
  value,
  label: REFUND_KIND[value],
}));
export const RECORD_KINDS = (Object.keys(RECORD_KIND) as DepositRecordKindType[]).map((value) => ({
  value,
  label: RECORD_KIND[value],
}));
export const refundKindLabel = (v: string) => label(REFUND_KIND, v);
export const recordKindLabel = (v: string) => label(RECORD_KIND, v);
export const actorLabel = (v: string) => label(ACTOR, v);
export const refundStatusMeta = (v: string) =>
  Object.hasOwn(REFUND_STATUS, v)
    ? REFUND_STATUS[v as RefundStatusType]
    : { label: v, tone: 'neutral' as const };

const PICKUP_SOON_MS = 3 * 3600_000;

/** 입금 확인 목록의 픽업 강조: 지났으면 negative(확인 불가), 3시간 미만이면 caution */
export function pickupTone(pickupAt: string, now: Date): PillTone | null {
  const left = new Date(pickupAt).getTime() - now.getTime();
  if (left <= 0) return 'negative';
  return left < PICKUP_SOON_MS ? 'caution' : null;
}

export const isPast = (iso: string, now: Date) => new Date(iso).getTime() <= now.getTime();

type Counts = AdminTaskCountsQuery['adminTaskCounts'];

/**
 * 탭·사이드바 배지. 지금 처리할 수 있는 건만 센다 — 계좌 입력 대기 환불은 구매자를 기다리므로
 * 환불 탭 안의 칩에만 보인다
 */
export function taskBadges(c: Counts) {
  const deposits = c.pendingPayments;
  const refunds = c.refundsAwaitingTransfer;
  const settlements = c.pendingSettlements;
  return { deposits, refunds, settlements, total: deposits + refunds + settlements };
}

/** 처리 뒤 [다음 건]. 다시 받기 전 목록에 방금 처리한 건이 남아 있어도 세지 않는다 */
export function nextTask(
  ids: readonly string[] | undefined,
  totalCount: number | undefined,
  currentId: string,
): { nextId: string | null; remaining: number } {
  if (!ids || totalCount === undefined) return { nextId: null, remaining: 0 };
  const listed = ids.includes(currentId);
  return {
    nextId: ids.find((id) => id !== currentId) ?? null,
    remaining: Math.max(totalCount - (listed ? 1 : 0), 0),
  };
}

const codeOf = (e: unknown) => (e instanceof ApiError ? e.code : null);
export const isConflict = (e: unknown) => e instanceof ApiError && e.classification === 'CONFLICT';
export const isAmountMismatch = (e: unknown) => codeOf(e) === 'DEPOSIT_AMOUNT_MISMATCH';
export const isAmountInvalid = (e: unknown) => codeOf(e) === 'DEPOSIT_AMOUNT_INVALID';
export const isPickupPassed = (e: unknown) => codeOf(e) === 'PAYMENT_PICKUP_PASSED';

/** 단건 읽기 상태 문구. 없는 ID는 404로 오므로 오류 문구를 그대로 보인다 */
export function loadDescription(isLoading: boolean, error: Error | null, ready: string): string {
  if (error) return messageFor(error);
  return isLoading ? '불러오고 있습니다.' : ready;
}
