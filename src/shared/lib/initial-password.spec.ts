import {
  GENERATED_PASSWORD_ALPHABET,
  GENERATED_PASSWORD_LENGTH,
  generateInitialPassword,
  initialPasswordSchema,
} from './initial-password';

describe('initialPasswordSchema', () => {
  it.each([
    ['12345678', true], // 숫자만
    ['testadmin', true], // 아이디와 같은 소문자만
    ['Passw0rd!', true],
    ['a'.repeat(64), true],
    ['1234567', false], // 7자
    ['a'.repeat(65), false], // 65자
    [' '.repeat(8), false], // 공백뿐
    [' \t'.repeat(32), false], // 탭·공백뿐 64자
  ])('%s → %s', (pw, ok) => {
    expect(initialPasswordSchema.safeParse(pw).success).toBe(ok);
  });

  it.each([
    ['1234567', '8자 이상 입력해 주세요.'],
    ['a'.repeat(65), '64자 이하로 입력해 주세요.'],
    [' '.repeat(8), '공백만으로는 만들 수 없습니다.'],
  ])('%s 는 문장형 문구로 거절한다', (pw, message) => {
    expect(initialPasswordSchema.safeParse(pw).error?.issues[0]?.message).toBe(message);
  });
});

describe('generateInitialPassword', () => {
  afterEach(() => vi.restoreAllMocks());

  it('헷갈리는 글자 없이 12자를 만들고 초기 비밀번호 규칙을 통과한다', () => {
    for (let i = 0; i < 200; i += 1) {
      const pw = generateInitialPassword();
      expect(pw).toHaveLength(GENERATED_PASSWORD_LENGTH);
      expect(pw).toMatch(/^[A-HJ-NP-Za-km-np-z2-9]+$/);
      expect(initialPasswordSchema.safeParse(pw).success).toBe(true);
    }
  });

  it('부르는 때마다 다른 값이다', () => {
    const seen = new Set(Array.from({ length: 50 }, () => generateInitialPassword()));
    expect(seen.size).toBe(50);
  });

  it('글자 수로 나누어떨어지지 않는 구간의 바이트는 버린다(치우침 방지)', () => {
    const size = GENERATED_PASSWORD_ALPHABET.length; // 56 → 224 이상은 버림
    const limit = 256 - (256 % size);
    const bytes = [limit, 255, 0, limit - 1, 1];
    vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
      const view = new Uint8Array(array.buffer);
      view.fill(0);
      view.set(bytes.slice(0, view.length));
      return array;
    });
    const pw = generateInitialPassword(3);
    expect(pw).toBe(
      GENERATED_PASSWORD_ALPHABET[0]! +
        GENERATED_PASSWORD_ALPHABET[(limit - 1) % size]! +
        GENERATED_PASSWORD_ALPHABET[1]!,
    );
  });

  it('randomUUID가 없는 비보안 컨텍스트에서도 만든다', () => {
    vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) });
    try {
      expect(generateInitialPassword()).toHaveLength(GENERATED_PASSWORD_LENGTH);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
