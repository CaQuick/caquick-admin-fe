import { z } from 'zod';

import { initialPasswordSchema } from '@/shared/lib/initial-password';

/** BE AdminCreateAdminInput 규칙: 아이디 4~80 소문자·숫자·._-, 초기 비밀번호 8~64자. */
export const createAdminSchema = z.object({
  username: z
    .string()
    .trim()
    .regex(/^[a-z0-9._-]{4,80}$/, '4~80자, 소문자·숫자·. _ - 만'),
  password: initialPasswordSchema,
  email: z.string().trim().email('이메일 형식이 아닙니다.').or(z.literal('')),
  name: z.string().trim().max(100),
});
