import { z } from 'zod';

const USERNAME = /^[a-z0-9._-]{4,80}$/;
const strongPassword = z
  .string()
  .min(8, '8자 이상')
  .max(64, '64자 이하')
  .refine(
    (v) => /[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v) && /[^A-Za-z0-9]/.test(v),
    '대문자·소문자·숫자·특수문자를 각각 1자 이상',
  );

const optionalTrimmed = z.string().trim().max(500).optional();
const coord = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || !Number.isNaN(Number(v)), '숫자여야 합니다.');

/** BE AdminCreateSellerInput과 같은 규칙. 빈 문자열은 null로 보낸다. */
export const createSellerSchema = z.object({
  username: z.string().trim().regex(USERNAME, '4~80자, 소문자·숫자·. _ - 만'),
  password: strongPassword,
  email: z.string().trim().email('이메일 형식이 아닙니다.').optional().or(z.literal('')),
  name: optionalTrimmed,
  businessName: z.string().trim().min(1, '사업자명은 필수입니다.').max(200),
  businessPhone: z.string().trim().min(1, '사업자 전화는 필수입니다.').max(50),
  websiteUrl: z.string().trim().url('URL 형식이 아닙니다.').optional().or(z.literal('')),
  storeName: z.string().trim().min(1, '매장명은 필수입니다.').max(200),
  storePhone: z.string().trim().min(1, '매장 전화는 필수입니다.').max(50),
  addressFull: z.string().trim().min(1, '주소는 필수입니다.').max(500),
  addressCity: optionalTrimmed,
  addressDistrict: optionalTrimmed,
  addressNeighborhood: optionalTrimmed,
  regionId: z.string().trim().optional(),
  latitude: coord,
  longitude: coord,
  mapProvider: z.enum(['NAVER', 'KAKAO', 'NONE']),
});
export type CreateSellerValues = z.infer<typeof createSellerSchema>;

export const resetPasswordSchema = z
  .object({ newPassword: strongPassword, confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: '비밀번호가 서로 다릅니다.',
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

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
