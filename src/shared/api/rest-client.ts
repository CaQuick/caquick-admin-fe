import { AUTH_URL } from './config';
import { ApiError, classifyStatus } from './errors';
import { getSessionHooks } from './session';

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

/** `/auth/*` REST 호출. 쿠키(refresh)는 항상 포함. 401 재시도는 하지 않는다 — 인증 엔드포인트 자체라 auth feature가 결과를 해석한다. */
export async function authRequest<T>(path: string, options: RestOptions = {}): Promise<T> {
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
  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => null)) as (RestErrorBody & T) | null;
  if (!res.ok) {
    throw new ApiError(
      body?.message ?? `요청 실패 (${res.status})`,
      classifyStatus(res.status),
      body?.errorCode ?? null,
      res.status,
    );
  }
  return body as T;
}
