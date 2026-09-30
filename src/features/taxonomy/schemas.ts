import { z } from 'zod';

import { keywordText, listSearchBase, optionalBoolText } from '@/shared/lib/list-search';

export const CATEGORY_TYPES = [
  {
    value: 'EVENT',
    label: '이벤트',
    help: '구매자 앱 홈 상단 카테고리 탭과 랭킹에는 이벤트 카테고리만 쓰입니다.',
  },
  { value: 'STYLE', label: '스타일', help: '' },
  { value: 'OTHER', label: '기타', help: '' },
] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number]['value'];

export const categoriesSearchSchema = z.object({
  type: z.enum(['EVENT', 'STYLE', 'OTHER']).optional().catch(undefined),
  inactive: optionalBoolText,
});
export type CategoriesSearch = z.infer<typeof categoriesSearchSchema>;

export const tagsSearchSchema = z.object({ ...listSearchBase, q: keywordText });
export type TagsSearch = z.infer<typeof tagsSearchSchema>;
export type TagsSearchInput = z.input<typeof tagsSearchSchema>;

/** BE sortOrder는 GraphQL Int(부호 있는 32비트)라 넘으면 요청 자체가 거절된다 */
const SORT_ORDER_MIN = -(2 ** 31);
const SORT_ORDER_MAX = 2 ** 31 - 1;
const SORT_ORDER_RANGE = `정렬 순서는 ${SORT_ORDER_MIN.toLocaleString('ko-KR')}부터 ${SORT_ORDER_MAX.toLocaleString('ko-KR')} 사이로 입력해 주세요.`;

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '이름을 입력해 주세요.')
    .max(100, '이름은 100자 이하로 입력해 주세요.'),
  description: z.string().trim().max(255, '설명은 255자 이하로 입력해 주세요.'),
  sortOrder: z
    .number({ message: '정렬 순서를 숫자로 입력해 주세요.' })
    .int('정렬 순서는 정수로 입력해 주세요.')
    .min(SORT_ORDER_MIN, SORT_ORDER_RANGE)
    .max(SORT_ORDER_MAX, SORT_ORDER_RANGE),
  isActive: z.boolean(),
});
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const tagFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '이름을 입력해 주세요.')
    .max(80, '이름은 80자 이하로 입력해 주세요.'),
});
export type TagFormValues = z.infer<typeof tagFormSchema>;
