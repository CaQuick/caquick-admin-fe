import { z } from 'zod';

import {
  type AdminConfirmPaymentInput,
  type AdminCreateDepositReturnInput,
  type AdminRecordUnidentifiedDepositInput,
} from '@/graphql/generated/graphql';
import { ApiError, messageFor } from '@/shared/api';
import { localToIso } from '@/shared/lib/kst';

import { parseWon } from './search';

const NOTE_MAX = 500;
const DEPOSITOR_MAX = 50;
/** BE처럼 앞뒤 공백을 빼고 코드 포인트로 센다 */
const length = (s: string) => [...s.trim()].length;

export const FORM_MESSAGES = {
  depositedAmount: '입금액을 원 단위 숫자로 입력해 주세요.',
  amount: '입금액을 1원 이상 숫자로 입력해 주세요.',
  depositorRequired: '입금자명을 입력해 주세요.',
  depositorTooLong: `입금자명은 ${DEPOSITOR_MAX}자 이하로 입력해 주세요.`,
  noteRequired: '주인 모를 입금은 메모를 남겨야 기록할 수 있어요.',
  noteTooLong: `메모는 ${NOTE_MAX}자 이하로 입력해 주세요.`,
} as const;

export const confirmPaymentSchema = z
  .object({ depositedAmount: z.string(), note: z.string() })
  .superRefine((v, ctx) => {
    if (parseWon(v.depositedAmount) === null)
      ctx.addIssue({
        path: ['depositedAmount'],
        code: 'custom',
        message: FORM_MESSAGES.depositedAmount,
      });
    if (length(v.note) > NOTE_MAX)
      ctx.addIssue({ path: ['note'], code: 'custom', message: FORM_MESSAGES.noteTooLong });
  });
export type ConfirmPaymentValues = z.infer<typeof confirmPaymentSchema>;

export function toConfirmPaymentInput(
  orderId: string,
  v: ConfirmPaymentValues,
): AdminConfirmPaymentInput {
  return { orderId, depositedAmount: parseWon(v.depositedAmount)!, note: v.note.trim() || null };
}

const depositShape = {
  amount: z.string(),
  depositorName: z.string(),
  /** datetime-local(KST). 비우면 보내지 않는다 */
  depositedAt: z.string(),
  note: z.string(),
};
export type DepositValues = z.infer<z.ZodObject<typeof depositShape>>;

function checkDeposit(v: DepositValues, ctx: z.RefinementCtx, noteRequired: boolean) {
  const amount = parseWon(v.amount);
  if (amount === null || amount < 1)
    ctx.addIssue({ path: ['amount'], code: 'custom', message: FORM_MESSAGES.amount });
  const name = length(v.depositorName);
  if (name === 0)
    ctx.addIssue({
      path: ['depositorName'],
      code: 'custom',
      message: FORM_MESSAGES.depositorRequired,
    });
  else if (name > DEPOSITOR_MAX)
    ctx.addIssue({
      path: ['depositorName'],
      code: 'custom',
      message: FORM_MESSAGES.depositorTooLong,
    });
  const note = length(v.note);
  if (noteRequired && note === 0)
    ctx.addIssue({ path: ['note'], code: 'custom', message: FORM_MESSAGES.noteRequired });
  else if (note > NOTE_MAX)
    ctx.addIssue({ path: ['note'], code: 'custom', message: FORM_MESSAGES.noteTooLong });
}

export const depositReturnSchema = z
  .object(depositShape)
  .superRefine((v, ctx) => checkDeposit(v, ctx, false));
export const unidentifiedDepositSchema = z
  .object(depositShape)
  .superRefine((v, ctx) => checkDeposit(v, ctx, true));

export const emptyDeposit = (over: Partial<DepositValues> = {}): DepositValues => ({
  amount: '',
  depositorName: '',
  depositedAt: '',
  note: '',
  ...over,
});

const depositFields = (v: DepositValues) => ({
  amount: parseWon(v.amount)!,
  depositorName: v.depositorName.trim(),
  depositedAt: localToIso(v.depositedAt),
});

export function toDepositReturnInput(
  orderId: string,
  v: DepositValues,
): AdminCreateDepositReturnInput {
  return { orderId, ...depositFields(v), note: v.note.trim() || null };
}

export function toUnidentifiedDepositInput(v: DepositValues): AdminRecordUnidentifiedDepositInput {
  return { ...depositFields(v), note: v.note.trim() };
}

/** 저장 실패를 어디에 보일지. 입력 칸에 붙일 수 있으면 field, 입력 오류는 폼 상단, 그 밖은 토스트 */
export function depositFormError(e: unknown): {
  field: 'amount' | 'note' | null;
  inForm: boolean;
  message: string;
} {
  const code = e instanceof ApiError ? e.code : null;
  if (code === 'DEPOSIT_AMOUNT_INVALID')
    return { field: 'amount', inForm: true, message: FORM_MESSAGES.amount };
  if (code === 'DEPOSIT_NOTE_REQUIRED')
    return { field: 'note', inForm: true, message: FORM_MESSAGES.noteRequired };
  const inForm = e instanceof ApiError && e.classification === 'BAD_USER_INPUT';
  return { field: null, inForm, message: messageFor(e) };
}
