import {
  type AdminCancelOrderInput,
  type AdminOrderQuery,
  type OrderCancelFaultType,
} from '@/graphql/generated/graphql';
import { formatKrw } from '@/shared/lib/format';

export type CancelOptions = AdminOrderQuery['adminOrder']['cancelOptions'];

export const CANCEL_NOTE_MAX = 500;

export interface CancelForm {
  /** '' = 고르지 않음 */
  reason: string;
  fault: '' | OrderCancelFaultType;
  /** 입력 원문 */
  refundAmount: string;
  note: string;
}

export const EMPTY_CANCEL_FORM: CancelForm = { reason: '', fault: '', refundAmount: '', note: '' };

export type CancelFormIssue =
  | 'NOT_CANCELABLE'
  | 'REASON_REQUIRED'
  | 'NOTE_TOO_LONG'
  | 'FAULT_REQUIRED'
  | 'AMOUNT_REQUIRED'
  | 'AMOUNT_OUT_OF_RANGE';

/** BE처럼 앞뒤 공백을 뺀 코드 포인트 수(이모지도 1자) */
export const noteLength = (note: string) => [...note.trim()].length;

/** 사정을 고르는 규칙인지. 금액 입력은 그중 구매자 사정일 때만 */
export const asksFault = (o: CancelOptions) => o.refundRule === 'BY_FAULT';
export const asksAmount = (o: CancelOptions, f: CancelForm) => asksFault(o) && f.fault === 'BUYER';

/** 구매자 사정 환불액. 0~결제액 정수만 받고 아니면 null('0'은 유효) */
export function parseRefundAmount(raw: string, paidAmount: number): number | null {
  const t = raw.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n <= paidAmount ? n : null;
}

/** 다이얼로그 입력 → adminCancelOrder 입력. 규칙은 cancelOptions가 정하고 화면은 복제하지 않는다 */
export function buildCancelInput(
  orderId: string,
  o: CancelOptions,
  f: CancelForm,
): { input: AdminCancelOrderInput } | { issue: CancelFormIssue } {
  if (!o.cancelable) return { issue: 'NOT_CANCELABLE' };
  const reason = o.reasons.find((r) => r === f.reason);
  if (!reason) return { issue: 'REASON_REQUIRED' };
  if (noteLength(f.note) > CANCEL_NOTE_MAX) return { issue: 'NOTE_TOO_LONG' };
  const base = { orderId, reason, note: f.note.trim() || null };
  if (!asksFault(o)) return { input: base };
  if (f.fault === '') return { issue: 'FAULT_REQUIRED' };
  if (f.fault === 'SELLER') return { input: { ...base, fault: 'SELLER' } };
  if (f.refundAmount.trim() === '') return { issue: 'AMOUNT_REQUIRED' };
  const refundAmount = parseRefundAmount(f.refundAmount, o.paidAmount);
  if (refundAmount === null) return { issue: 'AMOUNT_OUT_OF_RANGE' };
  return { input: { ...base, fault: 'BUYER', refundAmount } };
}

/** 확인 버튼 위 요약. 고른 사정·금액으로 무엇이 일어나는지 */
export function cancelSummary(o: CancelOptions, f: CancelForm): string | null {
  const paid = formatKrw(o.paidAmount);
  const full =
    o.paidAmount > 0
      ? `결제액 ${paid}을 전액 환불합니다.`
      : '확인된 결제액이 없어 환불 없이 취소합니다.';
  if (o.refundRule === 'NO_REFUND') return '입금 전 주문이라 환불 없이 취소합니다.';
  if (o.refundRule === 'FULL_REFUND') return full;
  if (!asksFault(o)) return null;
  if (f.fault === 'SELLER') return `판매자 사정이라 ${full}`;
  if (f.fault !== 'BUYER') return '사정을 고르면 환불 금액이 정해집니다.';
  const r = parseRefundAmount(f.refundAmount, o.paidAmount);
  if (r === null) return `환불 금액을 0원~${paid} 사이 정수로 입력하세요.`;
  if (r === o.paidAmount) return full;
  return `${formatKrw(r)}을 환불하고, 남은 ${formatKrw(o.paidAmount - r)}은 수수료를 뺀 뒤 매장 정산에 포함합니다.`;
}
