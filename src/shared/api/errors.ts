export type ErrorClassification =
  | 'BAD_USER_INPUT'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_SERVER_ERROR'
  | 'NETWORK';

/** GraphQL·REST 공통 에러. code는 BE 에러 카탈로그 코드(예 STORE_NOT_FOUND), 없으면 null. */
export class ApiError extends Error {
  readonly classification: ErrorClassification;
  readonly code: string | null;
  readonly status: number;

  constructor(
    message: string,
    classification: ErrorClassification,
    code: string | null,
    status: number,
  ) {
    super(message);
    this.name = 'ApiError';
    this.classification = classification;
    this.code = code;
    this.status = status;
  }

  get isUnauthenticated(): boolean {
    return this.classification === 'UNAUTHENTICATED';
  }
}

export function classifyStatus(status: number): ErrorClassification {
  if (status === 400 || status === 422) return 'BAD_USER_INPUT';
  if (status === 401) return 'UNAUTHENTICATED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  return 'INTERNAL_SERVER_ERROR';
}

/** 카탈로그 코드 → 화면 문구. 표에 없으면 BE message를 그대로 쓴다. */
const MESSAGES: Record<string, string> = {
  AUTHENTICATION_REQUIRED: '로그인이 필요합니다.',
  INVALID_CREDENTIALS: '아이디 또는 비밀번호가 올바르지 않습니다.',
  MISSING_REFRESH_TOKEN: '세션이 만료되었습니다. 다시 로그인해 주세요.',
  INVALID_REFRESH_TOKEN: '세션이 만료되었습니다. 다시 로그인해 주세요.',
  PASSWORD_CHANGE_REQUIRED: '비밀번호를 변경한 뒤 이용할 수 있습니다.',
  ACCOUNT_TYPE_NOT_ALLOWED: '관리자 계정만 이용할 수 있습니다.',
};

export function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    const known = error.code ? MESSAGES[error.code] : undefined;
    if (known) return known;
    if (error.classification === 'NETWORK') return '서버에 연결할 수 없습니다.';
    return error.message;
  }
  return '알 수 없는 오류가 발생했습니다.';
}
