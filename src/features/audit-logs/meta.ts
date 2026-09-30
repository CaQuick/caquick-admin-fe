import { z } from 'zod';

import {
  type AdminAuditLogListInput,
  type AuditActionType,
  type AuditTargetType,
} from '@/graphql/generated/graphql';
import { kstDayEndIso, kstDayStartIso, parseYmd } from '@/shared/lib/kst';
import {
  DEFAULT_LIMIT,
  listSearchBase,
  optionalIdText,
  optionalText,
} from '@/shared/lib/list-search';
import { type PillTone } from '@/shared/ui/status-pill';

export const TARGET_TYPES: { value: AuditTargetType; label: string }[] = [
  { value: 'ORDER', label: '주문' },
  { value: 'STORE', label: '매장' },
  { value: 'PRODUCT', label: '상품' },
  { value: 'ACCOUNT', label: '계정' },
  { value: 'CHANGE_PASSWORD', label: '비밀번호 변경' },
  { value: 'BANNER', label: '배너' },
  { value: 'CATEGORY', label: '카테고리' },
  { value: 'TAG', label: '태그' },
  { value: 'REGION', label: '지역' },
  { value: 'REVIEW', label: '리뷰' },
  { value: 'REVIEW_COMMENT', label: '리뷰 댓글' },
  { value: 'REVIEW_REPORT', label: '신고' },
  { value: 'NOTIFICATION', label: '알림' },
  { value: 'CONVERSATION', label: '대화' },
];
export const ACTIONS: { value: AuditActionType; label: string; tone: PillTone }[] = [
  { value: 'CREATE', label: '생성', tone: 'positive' },
  { value: 'UPDATE', label: '수정', tone: 'primary' },
  { value: 'DELETE', label: '삭제', tone: 'negative' },
  { value: 'STATUS_CHANGE', label: '상태 변경', tone: 'caution' },
];
export const targetLabel = (v: string) => TARGET_TYPES.find((t) => t.value === v)?.label ?? v;
export const actionMeta = (v: string) =>
  ACTIONS.find((a) => a.value === v) ?? { value: v, label: v, tone: 'neutral' as const };

const TARGET_VALUES = TARGET_TYPES.map((t) => t.value) as [AuditTargetType, ...AuditTargetType[]];
const ACTION_VALUES = ACTIONS.map((a) => a.value) as [AuditActionType, ...AuditActionType[]];

export const auditSearchSchema = z.object({
  ...listSearchBase,
  actorId: optionalIdText,
  storeId: optionalIdText,
  targetType: z.enum(TARGET_VALUES).optional().catch(undefined),
  targetId: optionalIdText,
  action: z.enum(ACTION_VALUES).optional().catch(undefined),
  from: optionalText,
  to: optionalText,
});
export type AuditSearch = z.infer<typeof auditSearchSchema>;
export type AuditSearchInput = z.input<typeof auditSearchSchema>;

export function toAuditListInput(s: AuditSearch): AdminAuditLogListInput {
  const from = s.from ? parseYmd(s.from) : null;
  const to = s.to ? parseYmd(s.to) : null;
  return {
    limit: s.limit ?? DEFAULT_LIMIT,
    cursor: s.cursor ?? null,
    actorAccountId: s.actorId ?? null,
    storeId: s.storeId ?? null,
    targetType: s.targetType ?? null,
    targetId: s.targetId ?? null,
    action: s.action ?? null,
    fromCreatedAt: from ? kstDayStartIso(from) : null,
    toCreatedAt: to ? kstDayEndIso(to) : null,
  };
}
export function hasAuditFilters(s: AuditSearch): boolean {
  return [s.actorId, s.storeId, s.targetType, s.targetId, s.action, s.from, s.to].some(
    (v) => v !== undefined,
  );
}

/** JSON 문자열을 보기 좋게. 파싱이 안 되면 원문 그대로. */
export function prettyJson(raw: string | null | undefined): string {
  if (!raw) return '';
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}
