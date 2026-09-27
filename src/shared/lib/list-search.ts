import { z } from 'zod';

/** 커서 목록의 공통 검색 파라미터. limit은 BE 규약(1~100, 기본 20), cursor는 불투명 토큰. */
export const listSearchBase = {
  limit: z.coerce.number().int().min(1).max(100).optional().catch(undefined),
  cursor: z.string().min(1).optional().catch(undefined),
};

/** 빈 문자열·undefined는 필터 없음으로 취급한다. "0"은 유효한 ID라 버리지 않는다. */
export const optionalText = z
  .string()
  .optional()
  .transform((v) => (v === '' ? undefined : v))
  .catch(undefined);

export const DEFAULT_LIMIT = 20;
