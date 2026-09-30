import { z } from 'zod';

import { type AdminRegionsQuery, type AdminUpdateRegionInput } from '@/graphql/generated/graphql';
import { type CoordRange, LATITUDE_RANGE, LONGITUDE_RANGE, parseCoord } from '@/shared/lib/coords';
import { withJosa } from '@/shared/lib/josa';
import { optionalBoolText, optionalText } from '@/shared/lib/list-search';

export type Region = AdminRegionsQuery['adminRegions'][number];

export const regionsSearchSchema = z.object({ parent: optionalText, inactive: optionalBoolText });
export type RegionsSearch = z.infer<typeof regionsSearchSchema>;

const coord = (name: string, range: CoordRange) =>
  z
    .string()
    .trim()
    .refine(
      (v) => v === '' || parseCoord(v, range) !== null,
      `${withJosa(name, '은/는')} ${range.min}~${range.max} 사이 숫자로 입력해 주세요.`,
    );

// GraphQL Int는 32비트다. 넘으면 요청 전체가 거절된다
const INT32 = { min: -2_147_483_648, max: 2_147_483_647 };

export const regionFormSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해 주세요.').max(80, '80자 이하로 입력해 주세요.'),
  slug: z
    .string()
    .trim()
    .min(1, '영문 식별자를 입력해 주세요.')
    .max(120, '120자 이하로 입력해 주세요.')
    .regex(/^[a-z0-9-]+$/, '영문 소문자, 숫자, 하이픈(-)만 입력해 주세요.'),
  sortOrder: z
    .number({ message: '숫자를 입력해 주세요.' })
    .int('정수를 입력해 주세요.')
    .min(INT32.min, `${INT32.min.toLocaleString('ko-KR')} 이상으로 입력해 주세요.`)
    .max(INT32.max, `${INT32.max.toLocaleString('ko-KR')} 이하로 입력해 주세요.`),
  isActive: z.boolean(),
  centerLat: coord('중심 위도', LATITUDE_RANGE),
  centerLng: coord('중심 경도', LONGITUDE_RANGE),
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
