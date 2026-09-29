import { type TypedDocumentString } from '@/graphql/generated/graphql';

import { GRAPHQL_URL } from './config';
import { ApiError, classifyStatus, type ErrorClassification } from './errors';
import { getSessionHooks, refreshOnce } from './session';

interface GraphQLErrorShape {
  message: string;
  extensions?: { code?: string; classification?: string; statusCode?: number };
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLErrorShape[];
}

/** BE 필터를 거치지 않은 오류(Apollo 변수·문서 검증 등)는 extensions가 비어 HTTP status로 분류한다. */
function toApiError(errors: GraphQLErrorShape[], httpStatus: number): ApiError {
  const first = errors[0];
  const ext = first?.extensions ?? {};
  const status = ext.statusCode ?? (httpStatus >= 400 ? httpStatus : 500);
  return new ApiError(
    first?.message ?? 'GraphQL 오류',
    (ext.classification as ErrorClassification | undefined) ?? classifyStatus(status),
    ext.code ?? null,
    status,
  );
}

async function send<TResult, TVariables>(
  document: TypedDocumentString<TResult, TVariables>,
  variables: TVariables | undefined,
): Promise<{ status: number; body: GraphQLResponse<TResult> | null }> {
  const token = getSessionHooks().getAccessToken();
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ query: document.toString(), variables }),
    });
  } catch {
    throw new ApiError('네트워크 오류', 'NETWORK', null, 0);
  }
  const body = (await res.json().catch(() => null)) as GraphQLResponse<TResult> | null;
  return { status: res.status, body };
}

/**
 * GraphQL 요청 1건. 인증 만료(HTTP 401 또는 errors.classification=UNAUTHENTICATED)면 refresh 1회 뒤 재시도.
 * 그래도 실패면 ApiError(UNAUTHENTICATED)를 던진다 — 로그아웃 처리는 auth feature의 몫.
 */
export async function gqlRequest<TResult, TVariables>(
  document: TypedDocumentString<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
): Promise<TResult> {
  let { status, body } = await send(document, variables);
  const unauthenticated = (): boolean =>
    status === 401 || (body?.errors?.[0]?.extensions?.classification ?? '') === 'UNAUTHENTICATED';
  if (unauthenticated() && (await refreshOnce())) {
    ({ status, body } = await send(document, variables));
  }
  if (body?.errors?.length) throw toApiError(body.errors, status);
  if (!body?.data) {
    throw new ApiError(
      `GraphQL 응답 오류 (${status})`,
      status === 401 ? 'UNAUTHENTICATED' : 'INTERNAL_SERVER_ERROR',
      null,
      status,
    );
  }
  return body.data;
}
