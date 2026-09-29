import { z } from 'zod';

import { keywordText, listSearchBase, optionalBoolText } from '@/shared/lib/list-search';

export const CATEGORY_TYPES = [
  { value: 'EVENT', label: '이벤트', help: '홈 칩·랭킹은 이 타입만 쓴다' },
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

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, '이름은 필수입니다.').max(100, '100자 이하'),
  description: z.string().trim().max(255, '255자 이하'),
  sortOrder: z.number({ message: '숫자여야 합니다.' }).int('정수').min(-100000).max(100000),
  isActive: z.boolean(),
});
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const tagFormSchema = z.object({
  name: z.string().trim().min(1, '이름은 필수입니다.').max(80, '80자 이하'),
});
export type TagFormValues = z.infer<typeof tagFormSchema>;
