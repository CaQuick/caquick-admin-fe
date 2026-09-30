import { z } from 'zod';

import { refineCoordPair, storeLocationShape } from '@/features/stores';
import { initialPasswordSchema } from '@/shared/lib/initial-password';

const USERNAME = /^[a-z0-9._-]{4,80}$/;

/** BE 상한(auth-admin.constants·store-field-limits). BE는 trim 뒤 코드 포인트로 센다. */
const SELLER_FIELD_MAX = {
  email: 320,
  name: 100,
  businessName: 200,
  businessPhone: 30,
  websiteUrl: 2048,
  storeName: 200,
  storePhone: 30,
} as const;

const maxChars = (max: number) =>
  z
    .string()
    .trim()
    .refine((v) => [...v].length <= max, `${max}자 이하로 입력해 주세요.`);
const required = (max: number, message: string) =>
  maxChars(max).refine((v) => v.length > 0, message);
const optional = (max: number) => maxChars(max).optional();

/** 빈 문자열은 null로 보낸다. 주소·지역·좌표·지도 제공자는 매장 수정과 같은 칸이다. */
const sellerFields = z.object({
  username: z
    .string()
    .trim()
    .regex(
      USERNAME,
      '아이디는 4~80자의 영문 소문자, 숫자, 마침표(.), 밑줄(_), 하이픈(-)으로 입력해 주세요.',
    ),
  password: initialPasswordSchema,
  email: maxChars(SELLER_FIELD_MAX.email)
    .email('이메일 형식이 아닙니다.')
    .optional()
    .or(z.literal('')),
  name: optional(SELLER_FIELD_MAX.name),
  businessName: required(SELLER_FIELD_MAX.businessName, '사업자명은 필수입니다.'),
  businessPhone: required(SELLER_FIELD_MAX.businessPhone, '사업자 전화는 필수입니다.'),
  websiteUrl: maxChars(SELLER_FIELD_MAX.websiteUrl)
    .url('URL 형식이 아닙니다.')
    .optional()
    .or(z.literal('')),
  storeName: required(SELLER_FIELD_MAX.storeName, '매장명은 필수입니다.'),
  storePhone: required(SELLER_FIELD_MAX.storePhone, '매장 전화는 필수입니다.'),
  ...storeLocationShape,
});
export const createSellerSchema = sellerFields.superRefine(refineCoordPair);
export type CreateSellerValues = z.infer<typeof createSellerSchema>;

const orNull = (v: string | undefined) => (v && v.length > 0 ? v : null);

export function toCreateSellerInput(v: CreateSellerValues) {
  return {
    username: v.username,
    password: v.password,
    email: orNull(v.email),
    name: orNull(v.name),
    businessName: v.businessName,
    businessPhone: v.businessPhone,
    websiteUrl: orNull(v.websiteUrl),
    store: {
      storeName: v.storeName,
      storePhone: v.storePhone,
      addressFull: v.addressFull,
      addressCity: orNull(v.addressCity),
      addressDistrict: orNull(v.addressDistrict),
      addressNeighborhood: orNull(v.addressNeighborhood),
      regionId: orNull(v.regionId),
      latitude: orNull(v.latitude),
      longitude: orNull(v.longitude),
      mapProvider: v.mapProvider,
    },
  };
}
