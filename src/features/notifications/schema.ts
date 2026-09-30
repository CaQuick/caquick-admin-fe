import { z } from 'zod';

import { type AdminSendNotificationInput } from '@/graphql/generated/graphql';
import { isIdText } from '@/shared/lib/list-search';

export const MAX_TARGET_ACCOUNTS = 500;

/** "1, 2\n3" → ['1','2','3'] (중복 제거). 숫자가 아닌 값은 invalid로 따로 돌려준다 */
export function parseAccountIds(raw: string): { ids: string[]; invalid: string[] } {
  const tokens = [
    ...new Set(
      raw
        .split(/[\s,]+/)
        .map((v) => v.trim())
        .filter((v) => v.length > 0),
    ),
  ];
  return { ids: tokens.filter(isIdText), invalid: tokens.filter((v) => !isIdText(v)) };
}

export const sendSchema = z
  .object({
    type: z.enum(['SYSTEM', 'MARKETING']),
    title: z
      .string()
      .trim()
      .min(1, '제목을 입력해 주세요.')
      .max(200, '제목은 200자 이하로 입력해 주세요.'),
    body: z
      .string()
      .trim()
      .min(1, '본문을 입력해 주세요.')
      .max(2000, '본문은 2,000자 이하로 입력해 주세요.'),
    targetKind: z.enum(['ALL_USERS', 'ACCOUNT_IDS']),
    accountIds: z.array(z.string()),
  })
  .superRefine((v, ctx) => {
    if (v.targetKind !== 'ACCOUNT_IDS') return;
    if (v.accountIds.length === 0)
      ctx.addIssue({
        path: ['accountIds'],
        code: 'custom',
        message: '받을 구매자를 1명 이상 골라 주세요.',
      });
    else if (v.accountIds.length > MAX_TARGET_ACCOUNTS)
      ctx.addIssue({
        path: ['accountIds'],
        code: 'custom',
        message: `한 번에 ${MAX_TARGET_ACCOUNTS}명까지 보낼 수 있습니다. 지금 ${v.accountIds.length}명을 골랐습니다.`,
      });
  });
export type SendValues = z.infer<typeof sendSchema>;

/** 8~64자, 공백 없음. 폼을 열 때 1번 만들고 재시도에는 같은 키를 써서 중복 발송을 막는다. */
export function newIdempotencyKey(): string {
  // randomUUID는 보안 컨텍스트(https·localhost)에만 있다 — http LAN 접속에서도 화면이 떠야 한다
  const id =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
          b.toString(16).padStart(2, '0'),
        ).join('');
  return `admin-${id}`;
}

export function toSendInput(v: SendValues, idempotencyKey: string): AdminSendNotificationInput {
  return {
    type: v.type,
    title: v.title,
    body: v.body,
    idempotencyKey,
    targetKind: v.targetKind,
    accountIds: v.targetKind === 'ACCOUNT_IDS' ? [...new Set(v.accountIds)] : null,
  };
}
