import { z } from 'zod';

import { type AdminRegionsQuery, type AdminUpdateRegionInput } from '@/graphql/generated/graphql';
import { optionalBoolText, optionalText } from '@/shared/lib/list-search';

export type Region = AdminRegionsQuery['adminRegions'][number];

export const regionsSearchSchema = z.object({ parent: optionalText, inactive: optionalBoolText });
export type RegionsSearch = z.infer<typeof regionsSearchSchema>;

const coord = (min: number, max: number) =>
  z
    .string()
    .trim()
    .refine(
      (v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= min && Number(v) <= max),
      `${min}~${max} 사이 숫자`,
    );

export const regionFormSchema = z.object({
  name: z.string().trim().min(1, '이름은 필수입니다.').max(80, '80자 이하'),
  slug: z
    .string()
    .trim()
    .min(1, 'slug는 필수입니다.')
    .max(120, '120자 이하')
    .regex(/^[a-z0-9-]+$/, '소문자·숫자·- 만'),
  sortOrder: z.number({ message: '숫자여야 합니다.' }).int('정수'),
  isActive: z.boolean(),
  centerLat: coord(-90, 90),
  centerLng: coord(-180, 180),
});
export type RegionFormValues = z.infer<typeof regionFormSchema>;

export function toFormValues(r?: Region): RegionFormValues {
  return r
    ? {
        name: r.name,
        slug: r.slug,
        sortOrder: r.sortOrder,
        isActive: r.isActive,
        centerLat: r.centerLat ?? '',
        centerLng: r.centerLng ?? '',
      }
    : { name: '', slug: '', sortOrder: 0, isActive: true, centerLat: '', centerLng: '' };
}

export function toCreateInput(v: RegionFormValues, parentId: string | null) {
  return {
    parentId,
    name: v.name,
    slug: v.slug,
    sortOrder: v.sortOrder,
    isActive: v.isActive,
    centerLat: v.centerLat === '' ? null : v.centerLat,
    centerLng: v.centerLng === '' ? null : v.centerLng,
  };
}

/** 바뀐 것만. 좌표는 빈 문자열이면 null(지움). */
export function toUpdateInput(
  regionId: string,
  before: RegionFormValues,
  after: RegionFormValues,
): AdminUpdateRegionInput | null {
  const input: AdminUpdateRegionInput = { regionId };
  let changed = false;
  const set = <K extends keyof AdminUpdateRegionInput>(
    key: K,
    value: AdminUpdateRegionInput[K],
  ) => {
    input[key] = value;
    changed = true;
  };
  if (before.name !== after.name) set('name', after.name);
  if (before.slug !== after.slug) set('slug', after.slug);
  if (before.sortOrder !== after.sortOrder) set('sortOrder', after.sortOrder);
  if (before.isActive !== after.isActive) set('isActive', after.isActive);
  if (before.centerLat !== after.centerLat)
    set('centerLat', after.centerLat === '' ? null : after.centerLat);
  if (before.centerLng !== after.centerLng)
    set('centerLng', after.centerLng === '' ? null : after.centerLng);
  return changed ? input : null;
}
