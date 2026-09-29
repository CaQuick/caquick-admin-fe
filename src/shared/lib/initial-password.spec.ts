import { initialPasswordSchema } from './initial-password';

describe('initialPasswordSchema', () => {
  it.each([
    ['12345678', true], // 숫자만
    ['testadmin', true], // 아이디와 같은 소문자만
    ['Passw0rd!', true],
    ['a'.repeat(64), true],
    ['1234567', false], // 7자
    ['a'.repeat(65), false], // 65자
  ])('%s → %s', (pw, ok) => {
    expect(initialPasswordSchema.safeParse(pw).success).toBe(ok);
  });
});
