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

/** `?active=false`처럼 boolean으로 파싱된 값도 받는 'true' | 'false' 문자열. */
export const optionalBoolText = z
  .union([z.enum(['true', 'false']), z.boolean()])
  .optional()
  .transform((v) => (typeof v === 'boolean' ? (v ? 'true' : 'false') : v))
  .catch(undefined);

export const DEFAULT_LIMIT = 20;
