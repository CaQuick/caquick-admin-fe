import { z } from 'zod';

import { initialPasswordSchema } from '@/shared/lib/initial-password';

export const resetPasswordSchema = z
  .object({ newPassword: initialPasswordSchema, confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: '비밀번호가 서로 다릅니다.',
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
