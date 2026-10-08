import { createAdminSchema } from './create-admin-schema';

const base = { username: 'ops.admin', password: 'Passw0rd!', email: '', name: '' };

describe('createAdminSchema', () => {
  it.each([
    [{}, true],
    [{ username: 'Ops' }, false],
    [{ username: 'Ops.Admin_1' }, true],
    [{ username: 'ops@admin' }, false],
    [{ email: 'nope' }, false],
    [{ email: 'a@b.co', name: '운영' }, true],
  ])('%j → %s', (patch, ok) => {
    expect(createAdminSchema.safeParse({ ...base, ...patch }).success).toBe(ok);
  });

  it.each([
    ['12345678', true],
    ['testadmin', true],
    ['1234567', false],
    ['a'.repeat(65), false],
  ])('초기 비밀번호 %s → %s (조합 규칙 없이 8~64자)', (password, ok) => {
    expect(createAdminSchema.safeParse({ ...base, password }).success).toBe(ok);
  });
});
