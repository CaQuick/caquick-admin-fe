import { ApiError, classifyStatus, messageFor } from './errors';

describe('classifyStatus', () => {
  it.each([
    [400, 'BAD_USER_INPUT'],
    [422, 'BAD_USER_INPUT'],
    [401, 'UNAUTHENTICATED'],
    [403, 'FORBIDDEN'],
    [404, 'NOT_FOUND'],
    [409, 'CONFLICT'],
    [500, 'INTERNAL_SERVER_ERROR'],
    [503, 'INTERNAL_SERVER_ERROR'],
  ] as const)('%d → %s', (status, expected) => {
    expect(classifyStatus(status)).toBe(expected);
  });
});

describe('messageFor', () => {
  it('표에 있는 코드는 한국어 문구로 바꾼다', () => {
    const e = new ApiError('Invalid credentials', 'UNAUTHENTICATED', 'INVALID_CREDENTIALS', 401);
    expect(messageFor(e)).toBe('아이디 또는 비밀번호가 올바르지 않습니다.');
    expect(e.isUnauthenticated).toBe(true);
  });

  it.each(['INVALID_ACCESS_TOKEN', 'SESSION_ACCOUNT_MISSING'])(
    '%s는 세션 만료 문구로 바꾼다',
    (code) => {
      expect(
        messageFor(new ApiError('액세스 토큰이 유효하지 않습니다.', 'UNAUTHENTICATED', code, 401)),
      ).toBe('세션이 만료되었습니다. 다시 로그인해 주세요.');
    },
  );

  it('표에 없는 코드는 BE 메시지를 그대로 쓴다', () => {
    expect(
      messageFor(new ApiError('매장을 찾을 수 없습니다.', 'NOT_FOUND', 'STORE_NOT_FOUND', 404)),
    ).toBe('매장을 찾을 수 없습니다.');
  });

  // classification은 전부 INTERNAL_SERVER_ERROR로 두어, 분류가 아닌 code·status로 판단하는지 본다.
  it.each([
    ['INTERNAL_ERROR', 500],
    [null, 500],
    [null, 502],
  ] as const)('code %s·%d는 서버 원문을 고정 문구로 가린다', (code, status) => {
    const e = new ApiError(
      'Invalid `prisma.store.findMany()` invocation',
      'INTERNAL_SERVER_ERROR',
      code,
      status,
    );
    expect(messageFor(e)).toBe('서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
  });

  it.each([
    ['S3_PRESIGN_FAILED', 500],
    ['ORDER_NUMBER_GENERATION_FAILED', 500],
    ['VALIDATION_FAILED', 400],
    [null, 400],
    [null, 429],
  ] as const)('code %s·%d는 BE 문구를 그대로 쓴다', (code, status) => {
    const e = new ApiError('BE 문구', 'INTERNAL_SERVER_ERROR', code, status);
    expect(messageFor(e)).toBe('BE 문구');
  });

  it('네트워크 오류와 알 수 없는 오류는 고정 문구다', () => {
    expect(messageFor(new ApiError('x', 'NETWORK', null, 0))).toBe('서버에 연결할 수 없습니다.');
    expect(messageFor(new Error('boom'))).toBe('알 수 없는 오류가 발생했습니다.');
  });
});
