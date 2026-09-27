import { z } from 'zod';

import { type AdminSendNotificationInput } from '@/graphql/generated/graphql';

export const NOTIFICATION_TYPES = [
  { value: 'SYSTEM', label: '시스템', help: '운영 공지' },
  { value: 'MARKETING', label: '마케팅', help: '프로모션·이벤트' },
] as const;

/** "1, 2\n3" → ['1','2','3'] (중복 제거, 숫자만) */
export function parseAccountIds(raw: string): string[] {
  const ids = raw
    .split(/[\s,]+/)
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
  return [...new Set(ids)];
}

export const sendSchema = z
  .object({
    type: z.enum(['SYSTEM', 'MARKETING']),
    title: z.string().trim().min(1, '제목은 필수입니다.').max(200, '200자 이하'),
    body: z.string().trim().min(1, '본문은 필수입니다.').max(2000, '2000자 이하'),
    targetKind: z.enum(['ALL_USERS', 'ACCOUNT_IDS']),
    accountIdsRaw: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.targetKind !== 'ACCOUNT_IDS') return;
    const ids = parseAccountIds(v.accountIdsRaw);
    if (ids.length === 0)
      ctx.addIssue({
        path: ['accountIdsRaw'],
        code: 'custom',
        message: '계정 ID를 1개 이상 입력해 주세요.',
      });
    else if (ids.length > 500)
      ctx.addIssue({
        path: ['accountIdsRaw'],
        code: 'custom',
        message: `최대 500개까지 보낼 수 있습니다(${ids.length}개).`,
      });
    else if (ids.some((id) => !/^\d+$/.test(id)))
      ctx.addIssue({
        path: ['accountIdsRaw'],
        code: 'custom',
        message: '계정 ID는 숫자만 가능합니다.',
      });
  });
export type SendValues = z.infer<typeof sendSchema>;

/** 8~64자, 공백 없음. 폼을 열 때 1번 만들고 재시도에는 같은 키를 써서 중복 발송을 막는다. */
export function newIdempotencyKey(): string {
  return `admin-${crypto.randomUUID()}`.slice(0, 64);
}

export function toSendInput(v: SendValues, idempotencyKey: string): AdminSendNotificationInput {
  return {
    type: v.type,
    title: v.title,
    body: v.body,
    idempotencyKey,
    targetKind: v.targetKind,
    accountIds: v.targetKind === 'ACCOUNT_IDS' ? parseAccountIds(v.accountIdsRaw) : null,
  };
}
