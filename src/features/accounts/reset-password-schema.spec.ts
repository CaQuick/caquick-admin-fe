import { resetPasswordSchema } from './reset-password-schema';

describe('resetPasswordSchema', () => {
  it.each([
    ['12345678', '12345678', true],
    ['testadmin', 'testadmin', true],
    ['Passw0rd!', 'other', false], // 확인 불일치
    ['1234567', '1234567', false], // 7자
    ['a'.repeat(65), 'a'.repeat(65), false],
    [' '.repeat(8), ' '.repeat(8), false], // 공백뿐
  ])('%s / %s → %s (조합 규칙 없이 8~64자, 확인 일치)', (newPassword, confirmPassword, ok) => {
    expect(resetPasswordSchema.safeParse({ newPassword, confirmPassword }).success).toBe(ok);
  });

  it('불일치는 확인 칸에 문구를 단다', () => {
    const r = resetPasswordSchema.safeParse({ newPassword: 'Passw0rd!', confirmPassword: 'x' });
    expect(r.error?.issues).toEqual([
      expect.objectContaining({ path: ['confirmPassword'], message: '비밀번호가 서로 다릅니다.' }),
    ]);
  });
});
