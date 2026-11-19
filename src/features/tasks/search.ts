import { z } from 'zod';

import {
  type AdminDepositRecordListInput,
  type AdminPendingPaymentListInput,
  type AdminRefundListInput,
  type AdminSettlementListInput,
  type DepositRecordKindType,
} from '@/graphql/generated/graphql';
import { parseYmd } from '@/shared/lib/kst';
import {
  DEFAULT_LIMIT,
  listSearchBase,
  optionalIdText,
  optionalText,
} from '@/shared/lib/list-search';

import { RECORD_KINDS, REFUND_KIND_VALUES } from './meta';

/** GraphQL Int 상한 */
const MAX_INT = 2_147_483_647;

/** 원 단위 금액 문자열 → 정수. 쉼표는 허용하고, 정수가 아니거나 Int 범위를 넘으면 null. "0"은 유효하다 */
export function parseWon(raw: string): number | null {
  const v = raw.trim().replaceAll(',', '');
  if (!/^\d+$/.test(v)) return null;
  const n = Number(v);
  return n <= MAX_INT ? n : null;
}

const wonText = optionalText
  .refine((v) => v === undefined || parseWon(v) !== null)
  .catch(undefined);

/** BE 입금자명 필터 상한(50자). 넘으면 오류라 주소로 들어와도 잘라 보낸다 */
const DEPOSITOR_FILTER_MAX = 50;
const depositorText = optionalText
  .transform((v) => {
    const t = v?.trim() ?? '';
    return t === '' ? undefined : [...t].slice(0, DEPOSITOR_FILTER_MAX).join('');
  })
  .catch(undefined);

export const DEPOSIT_VIEWS = [
  { value: 'claimed', label: '확인 요청' },
  { value: 'pending', label: '입금 대기' },
  { value: 'records', label: '입금 기록' },
] as const;
export type DepositView = (typeof DEPOSIT_VIEWS)[number]['value'];

const RECORD_KIND_VALUES = RECORD_KINDS.map((k) => k.value) as [
  DepositRecordKindType,
  ...DepositRecordKindType[],
];

export const depositsSearchSchema = z.object({
  ...listSearchBase,
  view: z
    .enum(DEPOSIT_VIEWS.map((v) => v.value) as [DepositView, ...DepositView[]])
    .optional()
    .catch(undefined),
  orderId: optionalIdText,
  amount: wonText,
  depositorName: depositorText,
  kind: z.enum(RECORD_KIND_VALUES).optional().catch(undefined),
});
export type DepositsSearch = z.infer<typeof depositsSearchSchema>;
export type DepositsSearchInput = z.input<typeof depositsSearchSchema>;

export const depositView = (s: DepositsSearch): DepositView => s.view ?? 'claimed';

export function toPendingPaymentInput(s: DepositsSearch): AdminPendingPaymentListInput {
  return {
    limit: s.limit ?? DEFAULT_LIMIT,
    cursor: s.cursor ?? null,
    claimedOnly: depositView(s) === 'claimed',
    amount: s.amount === undefined ? null : parseWon(s.amount),
    depositorName: s.depositorName ?? null,
  };
}

export function toDepositRecordInput(s: DepositsSearch): AdminDepositRecordListInput {
  return { limit: s.limit ?? DEFAULT_LIMIT, cursor: s.cursor ?? null, kind: s.kind ?? null };
}

export const REFUND_VIEWS = [
  { value: 'AWAITING_TRANSFER', label: '송금 대기' },
  { value: 'AWAITING_ACCOUNT', label: '계좌 입력 대기' },
] as const;
type RefundView = (typeof REFUND_VIEWS)[number]['value'];

export const refundsSearchSchema = z.object({
  ...listSearchBase,
  status: z
    .enum(REFUND_VIEWS.map((v) => v.value) as [RefundView, ...RefundView[]])
    .optional()
    .catch(undefined),
  kind: z.enum(REFUND_KIND_VALUES).optional().catch(undefined),
  refundId: optionalIdText,
});
export type RefundsSearch = z.infer<typeof refundsSearchSchema>;
export type RefundsSearchInput = z.input<typeof refundsSearchSchema>;

export const refundView = (s: RefundsSearch): RefundView => s.status ?? 'AWAITING_TRANSFER';

export function toRefundListInput(s: RefundsSearch): AdminRefundListInput {
  return {
    limit: s.limit ?? DEFAULT_LIMIT,
    cursor: s.cursor ?? null,
    status: refundView(s),
    kind: s.kind ?? null,
  };
}

export const settlementsSearchSchema = z.object({
  ...listSearchBase,
  /** BE 경보 딥링크의 정산 기간 시작일(KST 월요일, YYYY-MM-DD) */
  periodStart: optionalText.refine((v) => v === undefined || parseYmd(v) !== null).catch(undefined),
  settlementId: optionalIdText,
});
export type SettlementsSearch = z.infer<typeof settlementsSearchSchema>;
export type SettlementsSearchInput = z.input<typeof settlementsSearchSchema>;

export function toSettlementListInput(s: SettlementsSearch): AdminSettlementListInput {
  return {
    limit: s.limit ?? DEFAULT_LIMIT,
    cursor: s.cursor ?? null,
    status: 'PENDING',
    periodStart: s.periodStart ?? null,
  };
}
