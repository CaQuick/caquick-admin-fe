import { z } from 'zod';

import {
  type AdminBannerQuery,
  type AdminCreateBannerInput,
  type AdminUpdateBannerInput,
} from '@/graphql/generated/graphql';
import { listSearchBase, optionalBoolText } from '@/shared/lib/list-search';

export type Banner = AdminBannerQuery['adminBanner'];

/** HOME_SUB·STORE는 소비자가 없어 선택지에서 뺀다. */
export const PLACEMENTS = [
  { value: 'HOME_MAIN', label: '홈 메인', help: '홈에서 "전체" 칩일 때' },
  {
    value: 'CATEGORY',
    label: '카테고리',
    help: '특정 이벤트 카테고리 칩일 때 — 이벤트 카테고리 링크 필수',
  },
  { value: 'SEARCH', label: '검색', help: '검색 진입 화면' },
] as const;
export const LINK_TYPES = [
  { value: 'NONE', label: '없음' },
  { value: 'URL', label: 'URL' },
  { value: 'PRODUCT', label: '상품' },
  { value: 'STORE', label: '매장' },
  { value: 'CATEGORY', label: '카테고리' },
] as const;
type Placement = (typeof PLACEMENTS)[number]['value'];
type LinkType = (typeof LINK_TYPES)[number]['value'];

export const bannersSearchSchema = z.object({
  ...listSearchBase,
  placement: z
    .enum(['HOME_MAIN', 'CATEGORY', 'SEARCH', 'HOME_SUB', 'STORE'])
    .optional()
    .catch(undefined),
  active: optionalBoolText,
});
export type BannersSearch = z.infer<typeof bannersSearchSchema>;
export type BannersSearchInput = z.input<typeof bannersSearchSchema>;

const KST_OFFSET_MS = 9 * 3600_000;
/** datetime-local(KST) → UTC ISO. 빈 값은 null. */
export function localToIso(v: string): string | null {
  if (!v) return null;
  const [d, t] = v.split('T');
  const [y, m, day] = (d ?? '').split('-').map(Number);
  const [hh, mm] = (t ?? '00:00').split(':').map(Number);
  if (!y || !m || !day) return null;
  return new Date(Date.UTC(y, m - 1, day, hh ?? 0, mm ?? 0) - KST_OFFSET_MS).toISOString();
}
/** UTC ISO → datetime-local(KST) 값 */
export function isoToLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const k = new Date(new Date(iso).getTime() + KST_OFFSET_MS);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${k.getUTCFullYear()}-${p(k.getUTCMonth() + 1)}-${p(k.getUTCDate())}T${p(k.getUTCHours())}:${p(k.getUTCMinutes())}`;
}

export const bannerFormSchema = z
  .object({
    placement: z.enum(['HOME_MAIN', 'CATEGORY', 'SEARCH']),
    title: z.string().trim().max(200, '200자 이하'),
    imageUrl: z.string().min(1, '이미지를 올려 주세요.'),
    linkType: z.enum(['NONE', 'URL', 'PRODUCT', 'STORE', 'CATEGORY']),
    linkValue: z.string().trim(),
    startsAt: z.string(),
    endsAt: z.string(),
    sortOrder: z.number({ message: '숫자여야 합니다.' }).int('정수'),
    isActive: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.linkType !== 'NONE' && v.linkValue === '')
      ctx.addIssue({ path: ['linkValue'], code: 'custom', message: '링크 대상을 입력해 주세요.' });
    if (v.linkType === 'URL' && v.linkValue && !/^https?:\/\//.test(v.linkValue))
      ctx.addIssue({
        path: ['linkValue'],
        code: 'custom',
        message: 'http(s):// 로 시작해야 합니다.',
      });
    if (v.placement === 'CATEGORY' && v.linkType !== 'CATEGORY')
      ctx.addIssue({
        path: ['linkType'],
        code: 'custom',
        message: '카테고리 배치는 이벤트 카테고리 링크가 필수입니다.',
      });
    const s = localToIso(v.startsAt);
    const e = localToIso(v.endsAt);
    if (s && e && s >= e)
      ctx.addIssue({ path: ['endsAt'], code: 'custom', message: '종료가 시작보다 뒤여야 합니다.' });
  });
export type BannerFormValues = z.infer<typeof bannerFormSchema>;

export function defaultBannerValues(placement: Placement = 'HOME_MAIN'): BannerFormValues {
  return {
    placement,
    title: '',
    imageUrl: '',
    linkType: 'NONE',
    linkValue: '',
    startsAt: '',
    endsAt: '',
    sortOrder: 0,
    isActive: true,
  };
}

export function toFormValues(b: Banner): BannerFormValues {
  const placement: Placement =
    b.placement === 'HOME_SUB' || b.placement === 'STORE' ? 'HOME_MAIN' : b.placement;
  const linkValue =
    b.linkType === 'URL'
      ? (b.linkUrl ?? '')
      : b.linkType === 'PRODUCT'
        ? (b.linkProductId ?? '')
        : b.linkType === 'STORE'
          ? (b.linkStoreId ?? '')
          : b.linkType === 'CATEGORY'
            ? (b.linkCategoryId ?? '')
            : '';
  return {
    placement,
    title: b.title ?? '',
    imageUrl: b.imageUrl,
    linkType: b.linkType,
    linkValue,
    startsAt: isoToLocal(b.startsAt),
    endsAt: isoToLocal(b.endsAt),
    sortOrder: b.sortOrder,
    isActive: b.isActive,
  };
}

function linkFields(linkType: LinkType, value: string) {
  return {
    linkUrl: linkType === 'URL' ? value : null,
    linkProductId: linkType === 'PRODUCT' ? value : null,
    linkStoreId: linkType === 'STORE' ? value : null,
    linkCategoryId: linkType === 'CATEGORY' ? value : null,
  };
}

/** 생성: 유형에 맞는 링크 필드만 보내고 나머지는 생략(BE는 섞이면 BAD_USER_INPUT). */
export function toCreateInput(v: BannerFormValues): AdminCreateBannerInput {
  const links = linkFields(v.linkType, v.linkValue);
  return {
    placement: v.placement,
    title: v.title === '' ? null : v.title,
    imageUrl: v.imageUrl,
    linkType: v.linkType,
    ...(links.linkUrl !== null && { linkUrl: links.linkUrl }),
    ...(links.linkProductId !== null && { linkProductId: links.linkProductId }),
    ...(links.linkStoreId !== null && { linkStoreId: links.linkStoreId }),
    ...(links.linkCategoryId !== null && { linkCategoryId: links.linkCategoryId }),
    startsAt: localToIso(v.startsAt),
    endsAt: localToIso(v.endsAt),
    sortOrder: v.sortOrder,
    isActive: v.isActive,
  };
}

/** 수정: 바뀐 것만. 링크 유형이 바뀌면 BE가 이전 링크 필드를 지우므로 유형+새 값만 보낸다. */
export function toUpdateInput(
  bannerId: string,
  before: BannerFormValues,
  after: BannerFormValues,
): AdminUpdateBannerInput | null {
  const input: AdminUpdateBannerInput = { bannerId };
  let changed = false;
  const set = <K extends keyof AdminUpdateBannerInput>(
    key: K,
    value: AdminUpdateBannerInput[K],
  ) => {
    input[key] = value;
    changed = true;
  };
  if (before.placement !== after.placement) set('placement', after.placement);
  if (before.title !== after.title) set('title', after.title === '' ? null : after.title);
  if (before.imageUrl !== after.imageUrl) set('imageUrl', after.imageUrl);
  if (before.linkType !== after.linkType || before.linkValue !== after.linkValue) {
    set('linkType', after.linkType);
    const links = linkFields(after.linkType, after.linkValue);
    if (links.linkUrl !== null) set('linkUrl', links.linkUrl);
    if (links.linkProductId !== null) set('linkProductId', links.linkProductId);
    if (links.linkStoreId !== null) set('linkStoreId', links.linkStoreId);
    if (links.linkCategoryId !== null) set('linkCategoryId', links.linkCategoryId);
  }
  if (before.startsAt !== after.startsAt) set('startsAt', localToIso(after.startsAt));
  if (before.endsAt !== after.endsAt) set('endsAt', localToIso(after.endsAt));
  if (before.sortOrder !== after.sortOrder) set('sortOrder', after.sortOrder);
  if (before.isActive !== after.isActive) set('isActive', after.isActive);
  return changed ? input : null;
}
