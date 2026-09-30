import { z } from 'zod';

import {
  type AdminStoreQuery,
  type AdminUpdateStoreBasicInfoInput,
} from '@/graphql/generated/graphql';

import { maxChars, refineCoordPair, storeLocationShape } from './location-schema';

export type StoreDetail = AdminStoreQuery['adminStore']['store'];

/** BE store-field-limits. */
const STORE_TEXT_MAX = {
  storeName: 200,
  storePhone: 30,
  websiteUrl: 2048,
  businessHoursText: 500,
  greetingMessage: 500,
} as const;

/** 부분 수정 폼. 모든 필드를 현재 값으로 채워 두고, 바뀐 것만 보낸다. 빈 문자열은 "지움(null)". */
export const storeEditSchema = z
  .object({
    storeName: maxChars(STORE_TEXT_MAX.storeName).refine(
      (v) => v.length > 0,
      '매장명은 필수입니다.',
    ),
    storePhone: maxChars(STORE_TEXT_MAX.storePhone).refine(
      (v) => v.length > 0,
      '매장 전화는 필수입니다.',
    ),
    ...storeLocationShape,
    websiteUrl: maxChars(STORE_TEXT_MAX.websiteUrl).refine(
      (v) => v === '' || /^https?:\/\//.test(v),
      'http:// 또는 https://로 시작하는 주소를 입력해 주세요.',
    ),
    businessHoursText: maxChars(STORE_TEXT_MAX.businessHoursText),
    greetingMessage: maxChars(STORE_TEXT_MAX.greetingMessage),
    profileImageUrl: z.string().nullable(),
  })
  .superRefine(refineCoordPair);
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
