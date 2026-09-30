import { AUTH_URL } from './config';
import { ApiError, classifyStatus } from './errors';
import { getSessionHooks, refreshOnce } from './session';

/** BE REST 에러 envelope(ApiResponseTemplate.ERROR). 로그인 성공 응답은 envelope 없이 본문 그대로다. */
interface RestErrorBody {
  message?: string;
  code?: number;
  errorCode?: string | null;
}

export interface RestOptions {
  body?: unknown;
  /** true면 Authorization 헤더를 붙인다(비밀번호 변경 등). 로그인·refresh는 쿠키만 쓴다. */
  auth?: boolean;
}

/**
 * 401이지만 입력 오류라 refresh 대상이 아닌 코드. 그 밖의 401(토큰 만료, 계정 소멸 등)은 GraphQL과 같이 refresh를 1회 시도한다 —
 * 세션이 끝났으면 refresh 실패로 auth가 스토어를 비워 로그인 화면으로 보낸다.
 */
const INPUT_ERROR_CODES = new Set(['CURRENT_PASSWORD_INVALID']);

async function send(
  path: string,
  options: RestOptions,
): Promise<{ status: number; body: RestErrorBody | null }> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (options.auth) {
    const token = getSessionHooks().getAccessToken();
    if (token) headers.authorization = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(`${AUTH_URL}${path}`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError('네트워크 오류', 'NETWORK', null, 0);
  }
  if (res.status === 204) return { status: 204, body: null };
  return { status: res.status, body: (await res.json().catch(() => null)) as RestErrorBody | null };
}

/**
 * `/auth/*` REST 호출. 쿠키(refresh)는 항상 포함.
 * `auth: true` 요청이 입력 오류가 아닌 401이면 refresh 1회 뒤 재시도한다. 로그인·refresh 자체는 결과를 auth feature가 해석한다.
 */
export async function authRequest<T>(path: string, options: RestOptions = {}): Promise<T> {
  let { status, body } = await send(path, options);
  if (
    options.auth &&
    status === 401 &&
    !INPUT_ERROR_CODES.has(body?.errorCode ?? '') &&
    (await refreshOnce())
  ) {
    ({ status, body } = await send(path, options));
  }
  if (status === 204) return undefined as T;
  if (status < 200 || status >= 300) {
    throw new ApiError(
      body?.message ?? `요청 실패 (${status})`,
      classifyStatus(status),
      body?.errorCode ?? null,
      status,
    );
  }
  return body as T;
}
