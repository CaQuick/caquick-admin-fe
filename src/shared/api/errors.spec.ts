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

  it('표에 없는 코드는 BE 메시지를 그대로 쓴다', () => {
    expect(
      messageFor(new ApiError('매장을 찾을 수 없습니다.', 'NOT_FOUND', 'STORE_NOT_FOUND', 404)),
    ).toBe('매장을 찾을 수 없습니다.');
  });

  it('네트워크 오류와 알 수 없는 오류는 고정 문구다', () => {
    expect(messageFor(new ApiError('x', 'NETWORK', null, 0))).toBe('서버에 연결할 수 없습니다.');
    expect(messageFor(new Error('boom'))).toBe('알 수 없는 오류가 발생했습니다.');
  });
});
