import { z } from 'zod';

/** BE와 같은 규칙: 하이픈(과 공백)을 빼고 숫자 8~20자리 */
const normalizeAccountNumber = (v: string) => v.replace(/[\s-]/g, '');
const ACCOUNT_NUMBER = /^\d{8,20}$/;
const REASON_MAX = 500;

export const reasonField = z
  .string()
  .trim()
  .min(1, '사유를 입력해 주세요.')
  .max(REASON_MAX, `사유는 ${REASON_MAX}자 이하로 입력해 주세요.`);

export const bankAccountSchema = z.object({
  bankCode: z.string().min(1, '은행을 선택해 주세요.'),
  accountNumber: z
    .string()
    .refine(
      (v) => ACCOUNT_NUMBER.test(normalizeAccountNumber(v)),
      '계좌번호는 하이픈을 뺀 숫자 8~20자리로 입력해 주세요.',
    ),
  accountHolder: z
    .string()
    .trim()
    .min(1, '예금주를 입력해 주세요.')
    .max(50, '예금주는 50자 이하로 입력해 주세요.'),
  reason: reasonField,
});
export type BankAccountValues = z.infer<typeof bankAccountSchema>;

/** 전송 값: 계좌번호는 숫자만 */
export function toBankAccount(v: BankAccountValues) {
  return {
    bankCode: v.bankCode,
    accountNumber: normalizeAccountNumber(v.accountNumber),
    accountHolder: v.accountHolder,
    reason: v.reason,
  };
}
