import { z } from 'zod';

/** 커서 목록의 공통 검색 파라미터. limit은 BE 규약(1~100, 기본 20), cursor는 불투명 토큰. */
export const listSearchBase = {
  limit: z.coerce.number().int().min(1).max(100).optional().catch(undefined),
  cursor: z.string().min(1).optional().catch(undefined),
};

/**
 * 빈 문자열·undefined는 필터 없음. "0"은 유효한 ID라 버리지 않는다.
 * TanStack Router는 주소창의 `?id=17`을 숫자 17로 파싱하므로 숫자도 받아 문자열로 되돌린다.
 */
export const optionalText = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => (v === undefined || v === '' ? undefined : String(v)))
  .catch(undefined);

/** BE 목록 검색어 상한(`MAX_KEYWORD_LENGTH`). 넘으면 VALIDATION_FAILED라 URL로 들어와도 잘라 보낸다. */
export const MAX_KEYWORD_LENGTH = 100;

/** BE처럼 코드 포인트로 자른다. UTF-16으로 자르면 이모지가 반쪽 서로게이트로 남는다. */
export const keywordText = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => {
    const t = v === undefined ? '' : String(v).trim();
    return t === '' ? undefined : [...t].slice(0, MAX_KEYWORD_LENGTH).join('');
  })
  .catch(undefined);

/** BE parseId가 받는 값: 숫자만, DB UNSIGNED BIGINT 이하. */
const MAX_ID = 2n ** 64n - 1n;
export const isIdText = (v: string) => /^\d+$/.test(v) && BigInt(v) <= MAX_ID;

/** ID 필터. 숫자 파싱(`?storeId=17`)은 살리고, 형식이 틀린 값은 INVALID_ID 대신 필터 없음으로. */
export const optionalIdText = optionalText
  .refine((v) => v === undefined || isIdText(v))
  .catch(undefined);

/** `?active=false`처럼 boolean으로 파싱된 값도 받는 'true' | 'false' 문자열. */
export const optionalBoolText = z
  .union([z.enum(['true', 'false']), z.boolean()])
  .optional()
  .transform((v) => (typeof v === 'boolean' ? (v ? 'true' : 'false') : v))
  .catch(undefined);

export const DEFAULT_LIMIT = 20;
