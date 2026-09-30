/**
 * 라우터 검색 파라미터 직렬화. 값은 전부 문자열로 주고받고 타입은 각 라우트의 zod 스키마가 정한다.
 *
 * TanStack 기본값은 JSON이라 문자열 'true'·'17'을 불리언·숫자와 구분하려고 `?deleted=%22true%22`처럼
 * 따옴표로 감싼다. 여기서는 따옴표 없이 `?deleted=true`로 쓴다.
 */

// 기본 직렬화로 만든 옛 주소(`%22true%22`)와, 따옴표로 시작·끝나는 값을 보존하려고 감싼 값
const QUOTED = /^".*"$/s;

function unquote(value: string): string {
  if (!QUOTED.test(value)) return value;
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === 'string' ? parsed : value;
  } catch {
    return value;
  }
}

export function parseSearch(searchStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(searchStr)) {
    // 같은 키가 여러 번 오면 첫 값을 쓴다(URLSearchParams.get과 같은 규칙)
    if (!(key in result)) result[key] = unquote(value);
  }
  return result;
}

function stringifyValue(value: unknown): string {
  if (typeof value === 'string') return QUOTED.test(value) ? JSON.stringify(value) : value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return JSON.stringify(value);
}

export function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined) continue;
    params.set(key, stringifyValue(value));
  }
  const str = params.toString();
  return str ? `?${str}` : '';
}
