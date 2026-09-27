import { z } from 'zod';

import {
  type AdminStoreQuery,
  type AdminUpdateStoreBasicInfoInput,
} from '@/graphql/generated/graphql';

export type StoreDetail = AdminStoreQuery['adminStore']['store'];

const coord = z
  .string()
  .trim()
  .refine((v) => v === '' || !Number.isNaN(Number(v)), '숫자여야 합니다.');

/** 부분 수정 폼. 모든 필드를 현재 값으로 채워 두고, 바뀐 것만 보낸다. 빈 문자열은 "지움(null)". */
export const storeEditSchema = z.object({
  storeName: z.string().trim().min(1, '매장명은 필수입니다.').max(200),
  storePhone: z.string().trim().min(1, '전화는 필수입니다.').max(50),
  addressFull: z.string().trim().min(1, '주소는 필수입니다.').max(500),
  addressCity: z.string().trim().max(100),
  addressDistrict: z.string().trim().max(100),
  addressNeighborhood: z.string().trim().max(100),
  regionId: z.string().trim().max(20),
  latitude: coord,
  longitude: coord,
  mapProvider: z.enum(['NAVER', 'KAKAO', 'NONE']),
  websiteUrl: z
    .string()
    .trim()
    .refine((v) => v === '' || /^https?:\/\//.test(v), 'http(s):// 로 시작해야 합니다.'),
  businessHoursText: z.string().trim().max(500),
  greetingMessage: z.string().trim().max(500),
  profileImageUrl: z.string().nullable(),
});
export type StoreEditValues = z.infer<typeof storeEditSchema>;

export function toEditValues(s: StoreDetail): StoreEditValues {
  return {
    storeName: s.storeName,
    storePhone: s.storePhone,
    addressFull: s.addressFull,
    addressCity: s.addressCity ?? '',
    addressDistrict: s.addressDistrict ?? '',
    addressNeighborhood: s.addressNeighborhood ?? '',
    regionId: s.regionId ?? '',
    latitude: s.latitude ?? '',
    longitude: s.longitude ?? '',
    mapProvider: s.mapProvider,
    websiteUrl: s.websiteUrl ?? '',
    businessHoursText: s.businessHoursText ?? '',
    greetingMessage: s.greetingMessage ?? '',
    profileImageUrl: s.profileImageUrl,
  };
}

type Nullable =
  | 'addressCity'
  | 'addressDistrict'
  | 'addressNeighborhood'
  | 'regionId'
  | 'latitude'
  | 'longitude'
  | 'websiteUrl'
  | 'businessHoursText'
  | 'greetingMessage';
const NULLABLE: Nullable[] = [
  'addressCity',
  'addressDistrict',
  'addressNeighborhood',
  'regionId',
  'latitude',
  'longitude',
  'websiteUrl',
  'businessHoursText',
  'greetingMessage',
];
const REQUIRED = ['storeName', 'storePhone', 'addressFull', 'mapProvider'] as const;

/** 바뀐 필드만 담은 입력. 아무것도 안 바뀌면 null. */
export function diffToInput(
  storeId: string,
  before: StoreEditValues,
  after: StoreEditValues,
): AdminUpdateStoreBasicInfoInput | null {
  const input: AdminUpdateStoreBasicInfoInput = { storeId };
  let changed = false;
  for (const k of REQUIRED) {
    if (before[k] !== after[k]) {
      (input as Record<string, unknown>)[k] = after[k];
      changed = true;
    }
  }
  for (const k of NULLABLE) {
    if (before[k] !== after[k]) {
      input[k] = after[k] === '' ? null : after[k];
      changed = true;
    }
  }
  if (before.profileImageUrl !== after.profileImageUrl) {
    input.profileImageUrl = after.profileImageUrl;
    changed = true;
  }
  return changed ? input : null;
}
