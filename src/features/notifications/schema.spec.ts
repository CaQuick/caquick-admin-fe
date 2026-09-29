import { newIdempotencyKey, parseAccountIds, sendSchema, toSendInput } from './schema';

describe('notification schema', () => {
  it('계정 ID 파싱: 쉼표·줄바꿈·중복', () => {
    expect(parseAccountIds('1, 2\n3 ,2\n\n')).toEqual(['1', '2', '3']);
    expect(parseAccountIds('')).toEqual([]);
  });

  it('검증: 제목/본문 필수, ID 목록 조건', () => {
    const base = {
      type: 'SYSTEM' as const,
      title: '공지',
      body: '내용',
      targetKind: 'ALL_USERS' as const,
      accountIdsRaw: '',
    };
    expect(sendSchema.safeParse(base).success).toBe(true);
    expect(sendSchema.safeParse({ ...base, title: ' ' }).success).toBe(false);
    expect(sendSchema.safeParse({ ...base, targetKind: 'ACCOUNT_IDS' }).success).toBe(false);
    expect(
      sendSchema.safeParse({ ...base, targetKind: 'ACCOUNT_IDS', accountIdsRaw: '1, a' }).success,
    ).toBe(false);
    expect(
      sendSchema.safeParse({
        ...base,
        targetKind: 'ACCOUNT_IDS',
        accountIdsRaw: Array.from({ length: 501 }, (_, i) => String(i)).join(','),
      }).success,
    ).toBe(false);
    expect(
      sendSchema.safeParse({ ...base, targetKind: 'ACCOUNT_IDS', accountIdsRaw: '1,2' }).success,
    ).toBe(true);
  });

  afterEach(() => vi.unstubAllGlobals());

  it.each([
    { env: '보안 컨텍스트', stub: false },
    { env: 'http LAN, randomUUID 없음', stub: true },
  ])('멱등 키는 8~64자·공백 없음·매번 다르다 ($env)', ({ stub }) => {
    if (stub) vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) });
    const k = newIdempotencyKey();
    expect(k).toMatch(/^\S{8,64}$/);
    expect(newIdempotencyKey()).not.toBe(k);
  });

  it('입력 변환은 대상별 accountIds', () => {
    expect(
      toSendInput(
        { type: 'MARKETING', title: 't', body: 'b', targetKind: 'ALL_USERS', accountIdsRaw: '1' },
        'key-12345',
      ),
    ).toEqual({
      type: 'MARKETING',
      title: 't',
      body: 'b',
      idempotencyKey: 'key-12345',
      targetKind: 'ALL_USERS',
      accountIds: null,
    });
    expect(
      toSendInput(
        {
          type: 'SYSTEM',
          title: 't',
          body: 'b',
          targetKind: 'ACCOUNT_IDS',
          accountIdsRaw: '1,1,2',
        },
        'key-12345',
      ).accountIds,
    ).toEqual(['1', '2']);
  });
});
