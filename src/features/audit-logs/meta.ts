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
/** 작업자 계정 종류. null은 지워진 계정이다 */
const ACTOR_TYPE: Record<string, string> = {
  ADMIN: '관리자',
  SELLER: '판매자',
  USER: '구매자',
};
export const actorTypeLabel = (v: string | null | undefined) =>
  v == null ? '삭제된 계정' : (ACTOR_TYPE[v] ?? v);

/** BE 계정 라벨과 같은 규칙: `이름(아이디)`, 한쪽만 있으면 그 값, 둘 다 없으면 null */
export function accountLabel(
  name: string | null | undefined,
  username: string | null | undefined,
): string | null {
  if (name != null && username != null) return `${name}(${username})`;
  return name ?? username ?? null;
}

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

/** 변경 전·후 JSON의 항목 이름. 없는 이름은 원래 키를 그대로 보인다 */
const FIELD_LABEL: Record<string, string> = {
  status: '상태',
  note: '메모',
  reason: '사유',
  byAdmin: '관리자 처리',
  name: '이름',
  username: '아이디',
  accountType: '계정 유형',
  accountId: '계정 번호',
  storeId: '매장 번호',
  storeName: '매장명',
  storePhone: '매장 전화',
  productId: '상품 번호',
  reviewId: '리뷰 번호',
  reportId: '신고 번호',
  categoryType: '카테고리 유형',
  categoryId: '카테고리 번호',
  categoryIds: '카테고리 번호 목록',
  tagIds: '태그 번호 목록',
  description: '설명',
  sortOrder: '정렬 순서',
  isActive: '노출',
  placement: '노출 위치',
  linkType: '연결 대상 유형',
  title: '제목',
  type: '유형',
  targetKind: '발송 대상',
  sentCount: '보낸 수',
  skippedCount: '받지 못한 수',
  eventId: '요청 번호',
  changedAt: '변경 시각',
  regularPrice: '정가',
  salePrice: '판매가',
  addressFull: '주소',
  addressCity: '시·도',
  addressDistrict: '시·군·구',
  addressNeighborhood: '동',
  regionId: '지역 번호',
  latitude: '위도',
  longitude: '경도',
  mapProvider: '지도 제공자',
  websiteUrl: '웹사이트',
  businessHoursText: '영업시간',
  pickupSlotIntervalMinutes: '픽업 간격(분)',
  minLeadTimeMinutes: '최소 주문 마감(분)',
  maxDaysAhead: '최대 예약 가능 일수',
  capacity: '주문 한도',
  parentId: '상위 번호',
  templateId: '템플릿 번호',
  imageId: '이미지 번호',
  optionGroupId: '옵션 그룹 번호',
  optionItemId: '옵션 항목 번호',
};

export interface DiffRow {
  key: string;
  label: string;
  before: string;
  after: string;
  changed: boolean;
}

function parseObject(raw: string | null | undefined): Record<string, unknown> | null | undefined {
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    return v !== null && typeof v === 'object' && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

function cell(v: unknown): string {
  if (v === undefined || v === null) return '—';
  if (typeof v === 'boolean') return v ? '예' : '아니오';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  return JSON.stringify(v);
}

/**
 * 변경 전·후를 항목별 표로 편다. 한쪽이라도 객체가 아니면(배열·원시값·깨진 JSON) null을 돌려
 * 원문만 보이게 한다 — 표로 옮기다 값이 사라지면 안 된다.
 */
export function diffRows(
  beforeRaw: string | null | undefined,
  afterRaw: string | null | undefined,
): DiffRow[] | null {
  const before = parseObject(beforeRaw);
  const after = parseObject(afterRaw);
  if (before === undefined || after === undefined || (!before && !after)) return null;
  const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])];
  return keys.map((key) => {
    const b = cell(before?.[key]);
    const a = cell(after?.[key]);
    // 생성·삭제처럼 한쪽만 있으면 모든 항목이 '바뀐' 것이라 강조하지 않는다
    const changed = before !== null && after !== null && b !== a;
    return { key, label: FIELD_LABEL[key] ?? key, before: b, after: a, changed };
  });
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
