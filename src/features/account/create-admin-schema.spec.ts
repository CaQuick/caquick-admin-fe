import { createAdminSchema } from './create-admin-schema';

describe('createAdminSchema', () => {
  it.each([
    [{ username: 'ops.admin', password: 'Passw0rd!', email: '', name: '' }, true],
    [{ username: 'Ops', password: 'Passw0rd!', email: '', name: '' }, false],
    [{ username: 'ops.admin', password: 'password', email: '', name: '' }, false],
    [{ username: 'ops.admin', password: 'Passw0rd!', email: 'nope', name: '' }, false],
    [{ username: 'ops.admin', password: 'Passw0rd!', email: 'a@b.co', name: '운영' }, true],
  ])('%j → %s', (v, ok) => {
    expect(createAdminSchema.safeParse(v).success).toBe(ok);
  });
});
