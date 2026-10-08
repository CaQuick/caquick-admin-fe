import { z } from 'zod';

import { initialPasswordSchema } from '@/shared/lib/initial-password';

/** BE AdminCreateAdminInput 규칙: 아이디 4~80 영문·숫자·._-, 초기 비밀번호 8~64자. */
export const createAdminSchema = z.object({
  username: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z0-9._-]{4,80}$/,
      '아이디는 4~80자의 영문, 숫자, 마침표(.), 밑줄(_), 하이픈(-)으로 입력해 주세요.',
    ),
  password: initialPasswordSchema,
  email: z.string().trim().email('이메일 형식이 아닙니다.').or(z.literal('')),
  name: z.string().trim().max(100, '100자 이하로 입력해 주세요.'),
});
