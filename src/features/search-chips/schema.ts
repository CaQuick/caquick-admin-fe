import { z } from 'zod';

import {
  type AdminCreateSearchKeywordChipInput,
  type AdminSearchKeywordChipsQuery,
  type AdminUpdateSearchKeywordChipInput,
} from '@/graphql/generated/graphql';
import { ApiError, messageFor } from '@/shared/api';
import { formatKst, isoToLocal, localToIso } from '@/shared/lib/kst';

export type Chip = AdminSearchKeywordChipsQuery['adminSearchKeywordChips'][number];

/** BE 검색어 규칙과 같다: 정규화 뒤 1~200자(코드 포인트) */
export const KEYWORD_MAX_LENGTH = 200;
export const normalizeKeyword = (v: string) => v.trim().replace(/\s+/g, ' ');

export const CHIP_MESSAGES = {
  keywordEmpty: '키워드를 입력해 주세요.',
  keywordTooLong: `키워드는 ${KEYWORD_MAX_LENGTH}자 이하로 입력해 주세요.`,
  // 숨긴 칩도 키워드를 차지한다(삭제해야 풀린다)
  keywordTaken: '이미 같은 키워드의 칩이 있습니다. 숨긴 칩도 포함되니 기존 칩을 수정해 주세요.',
  window: '종료 시각은 시작 시각보다 뒤로 정해 주세요.',
  notFound: '그사이 삭제된 칩입니다. 목록을 새로 불러왔으니 확인해 주세요.',
  reorderConflict:
    '다른 관리자가 그사이 칩을 추가하거나 삭제해 순서를 저장하지 못했습니다. 목록을 새로 불러온 뒤 다시 정렬해 주세요.',
} as const;

export const chipFormSchema = z
  .object({
    keyword: z.string(),
    isActive: z.boolean(),
    startsAt: z.string(),
    endsAt: z.string(),
  })
  .superRefine((v, ctx) => {
    const keyword = normalizeKeyword(v.keyword);
    if (keyword === '')
      ctx.addIssue({ path: ['keyword'], code: 'custom', message: CHIP_MESSAGES.keywordEmpty });
    else if ([...keyword].length > KEYWORD_MAX_LENGTH)
      ctx.addIssue({ path: ['keyword'], code: 'custom', message: CHIP_MESSAGES.keywordTooLong });
    const s = localToIso(v.startsAt);
    const e = localToIso(v.endsAt);
    if (s && e && s >= e)
      ctx.addIssue({ path: ['endsAt'], code: 'custom', message: CHIP_MESSAGES.window });
  });
export type ChipFormValues = z.infer<typeof chipFormSchema>;

export const EMPTY_CHIP: ChipFormValues = { keyword: '', isActive: true, startsAt: '', endsAt: '' };

export function toChipFormValues(c: Chip): ChipFormValues {
  return {
    keyword: c.keyword,
    isActive: c.isActive,
    startsAt: isoToLocal(c.startsAt),
    endsAt: isoToLocal(c.endsAt),
  };
}

export function toCreateChipInput(v: ChipFormValues): AdminCreateSearchKeywordChipInput {
  return {
    keyword: normalizeKeyword(v.keyword),
    isActive: v.isActive,
    startsAt: localToIso(v.startsAt),
    endsAt: localToIso(v.endsAt),
  };
}

/** 수정: 바뀐 필드만. 비운 기간은 null로 보내 그 경계를 없앤다. 바뀐 게 없으면 null */
export function toUpdateChipInput(
  chipId: string,
  before: ChipFormValues,
  after: ChipFormValues,
): AdminUpdateSearchKeywordChipInput | null {
  const input: AdminUpdateSearchKeywordChipInput = { chipId };
  const keyword = normalizeKeyword(after.keyword);
  if (normalizeKeyword(before.keyword) !== keyword) input.keyword = keyword;
  if (before.isActive !== after.isActive) input.isActive = after.isActive;
  if (before.startsAt !== after.startsAt) input.startsAt = localToIso(after.startsAt);
  if (before.endsAt !== after.endsAt) input.endsAt = localToIso(after.endsAt);
  return Object.keys(input).length > 1 ? input : null;
}

/** 노출 기간(한국 시간). 둘 다 없으면 '제한 없음', 한쪽만 있으면 '시작 ~'·'~ 끝' */
export function formatWindow(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt && !endsAt) return '제한 없음';
  const s = startsAt ? formatKst(startsAt, true) : '';
  const e = endsAt ? formatKst(endsAt, true) : '';
  return `${s} ~ ${e}`.trim();
}

const codeOf = (e: unknown) => (e instanceof ApiError ? e.code : null);

/** 저장 실패를 어디에 보일지. 입력 칸에 붙일 수 있으면 field, 아니면 폼 상단 */
export function chipSaveError(e: unknown): {
  field: 'keyword' | 'endsAt' | null;
  message: string;
  notFound: boolean;
} {
  switch (codeOf(e)) {
    case 'KEYWORD_EMPTY':
      return { field: 'keyword', message: CHIP_MESSAGES.keywordEmpty, notFound: false };
    case 'KEYWORD_TOO_LONG':
      return { field: 'keyword', message: CHIP_MESSAGES.keywordTooLong, notFound: false };
    case 'SEARCH_KEYWORD_CHIP_TAKEN':
      return { field: 'keyword', message: CHIP_MESSAGES.keywordTaken, notFound: false };
    case 'INVALID_EXPOSURE_WINDOW':
      return { field: 'endsAt', message: CHIP_MESSAGES.window, notFound: false };
    case 'SEARCH_KEYWORD_CHIP_NOT_FOUND':
      return { field: null, message: CHIP_MESSAGES.notFound, notFound: true };
    default:
      return { field: null, message: messageFor(e), notFound: false };
  }
}

/** 화면을 연 사이 다른 관리자가 칩을 추가·삭제해 순서 저장이 거절됐다 */
export const isReorderConflict = (e: unknown) => {
  const code = codeOf(e);
  return code === 'IDS_LENGTH_MISMATCH' || code === 'INVALID_IDS';
};

/** from 자리의 항목을 to 자리로 옮긴 새 배열 */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return next;
  next.splice(to, 0, moved);
  return next;
}

/** 저장 전 순서를 서버 목록에 입힌다. 순서에 없는 칩은 뒤에 붙이고 사라진 칩은 뺀다 */
export function applyOrder<T extends { id: string }>(
  rows: readonly T[],
  order: readonly string[] | null,
): T[] {
  if (!order) return [...rows];
  const byId = new Map(rows.map((r) => [r.id, r]));
  const ordered = order.flatMap((id) => byId.get(id) ?? []);
  const seen = new Set(order);
  return [...ordered, ...rows.filter((r) => !seen.has(r.id))];
}

export const sameOrder = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id, i) => id === b[i]);
