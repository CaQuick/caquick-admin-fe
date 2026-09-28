import { z } from 'zod';

/** BE AdminCreateAdminInput 규칙: 아이디 4~80 소문자·숫자·._-, 강한 비밀번호. */
export const createAdminSchema = z.object({
  username: z
    .string()
    .trim()
    .regex(/^[a-z0-9._-]{4,80}$/, '4~80자, 소문자·숫자·. _ - 만'),
  password: z
    .string()
    .min(8, '8자 이상')
    .max(64, '64자 이하')
    .refine(
      (v) => /[A-Za-z]/.test(v) && /\d/.test(v) && /[^A-Za-z0-9]/.test(v),
      '알파벳·숫자·특수문자를 각각 1자 이상',
    ),
  email: z.string().trim().email('이메일 형식이 아닙니다.').or(z.literal('')),
  name: z.string().trim().max(100),
});
