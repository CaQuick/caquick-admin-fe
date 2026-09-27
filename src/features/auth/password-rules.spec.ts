import { changePasswordSchema, loginSchema, strongPasswordSchema } from './password-rules';

describe('password rules', () => {
  it.each([
    ['Abcdef1!', true],
    ['abcdef1!', false], // 대문자 없음
    ['ABCDEF1!', false], // 소문자 없음
    ['Abcdefg!', false], // 숫자 없음
    ['Abcdefg1', false], // 특수문자 없음
    ['Ab1!', false], // 8자 미만
    [`${'A'.repeat(62)}b1!`, false], // 65자
  ])('강한 비밀번호 %s → %s', (pw, ok) => {
    expect(strongPasswordSchema.safeParse(pw).success).toBe(ok);
  });

  it('로그인은 형식만 본다(아이디 4~80, 비밀번호 8~64)', () => {
    expect(loginSchema.safeParse({ username: 'abc', password: 'Abcdef1!' }).success).toBe(false);
    expect(loginSchema.safeParse({ username: 'abcd', password: 'weakweak' }).success).toBe(true);
  });

  it('새 비밀번호 확인이 다르거나 현재와 같으면 거절한다', () => {
    const base = {
      currentPassword: 'Current1!',
      newPassword: 'Newpass1!',
      confirmPassword: 'Newpass1!',
    };
    expect(changePasswordSchema.safeParse(base).success).toBe(true);
    expect(changePasswordSchema.safeParse({ ...base, confirmPassword: 'Other1!x' }).success).toBe(
      false,
    );
    expect(
      changePasswordSchema.safeParse({
        ...base,
        newPassword: 'Current1!',
        confirmPassword: 'Current1!',
      }).success,
    ).toBe(false);
  });
});
