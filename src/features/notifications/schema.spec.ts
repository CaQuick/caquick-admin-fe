import {
  MAX_TARGET_ACCOUNTS,
  type SendValues,
  newIdempotencyKey,
  parseAccountIds,
  sendSchema,
  toSendInput,
} from './schema';

const base: SendValues = {
  type: 'SYSTEM',
  title: '공지',
  body: '내용',
  targetKind: 'ALL_USERS',
  accountIds: [],
};
const ids = (n: number) => Array.from({ length: n }, (_, i) => String(i + 1));

describe('notification schema', () => {
  it.each([
    { raw: '1, 2\n3 ,2\n\n', ids: ['1', '2', '3'], invalid: [] },
    { raw: '', ids: [], invalid: [] },
    { raw: '0, 7', ids: ['0', '7'], invalid: [] },
    { raw: '1, a, -2, 3.5', ids: ['1'], invalid: ['a', '-2', '3.5'] },
    { raw: '18446744073709551616', ids: [], invalid: ['18446744073709551616'] },
  ])('계정 ID 파싱: "$raw"', ({ raw, ids: want, invalid }) => {
    expect(parseAccountIds(raw)).toEqual({ ids: want, invalid });
  });

  it.each<{ name: string; values: SendValues; path?: string; message?: string }>([
    { name: '전체 발송은 계정이 없어도 된다', values: base },
    {
      name: '제목이 공백뿐이면 거절한다',
      values: { ...base, title: ' ' },
      path: 'title',
      message: '제목을 입력해 주세요.',
    },
    {
      name: '제목 201자는 거절한다',
      values: { ...base, title: 'a'.repeat(201) },
      path: 'title',
      message: '제목은 200자 이하로 입력해 주세요.',
    },
    {
      name: '본문 2,001자는 거절한다',
      values: { ...base, body: 'a'.repeat(2001) },
      path: 'body',
      message: '본문은 2,000자 이하로 입력해 주세요.',
    },
    {
      name: '지정 발송에 구매자가 없으면 거절한다',
      values: { ...base, targetKind: 'ACCOUNT_IDS' },
      path: 'accountIds',
      message: '받을 구매자를 1명 이상 골라 주세요.',
    },
    {
      name: '지정 발송 500명은 받는다',
      values: { ...base, targetKind: 'ACCOUNT_IDS', accountIds: ids(MAX_TARGET_ACCOUNTS) },
    },
    {
      name: '지정 발송 501명은 거절한다',
      values: { ...base, targetKind: 'ACCOUNT_IDS', accountIds: ids(MAX_TARGET_ACCOUNTS + 1) },
      path: 'accountIds',
      message: '한 번에 500명까지 보낼 수 있습니다. 지금 501명을 골랐습니다.',
    },
  ])('검증: $name', ({ values, path, message }) => {
    const r = sendSchema.safeParse(values);
    if (!path) {
      expect(r.success).toBe(true);
      return;
    }
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => [i.path.join('.'), i.message])).toContainEqual([
      path,
      message,
    ]);
  });

  afterEach(() => vi.unstubAllGlobals());

  it.each([
    { env: '보안 컨텍스트', stub: false },
    { env: 'http LAN, randomUUID 없음', stub: true },
  ])('요청 번호는 8~64자·공백 없음·매번 다르다 ($env)', ({ stub }) => {
    if (stub) vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) });
    const k = newIdempotencyKey();
    expect(k).toMatch(/^\S{8,64}$/);
    expect(newIdempotencyKey()).not.toBe(k);
  });

  it('입력 변환: 전체 발송은 accountIds를 null로, 지정 발송은 중복을 뺀다', () => {
    expect(toSendInput({ ...base, type: 'MARKETING', accountIds: ['1'] }, 'key-12345')).toEqual({
      type: 'MARKETING',
      title: '공지',
      body: '내용',
      idempotencyKey: 'key-12345',
      targetKind: 'ALL_USERS',
      accountIds: null,
    });
    expect(
      toSendInput({ ...base, targetKind: 'ACCOUNT_IDS', accountIds: ['1', '1', '2'] }, 'key-12345')
        .accountIds,
    ).toEqual(['1', '2']);
  });
});
