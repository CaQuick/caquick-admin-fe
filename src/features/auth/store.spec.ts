import { useAuthStore } from './store';

describe('useAuthStore', () => {
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );

  it('setSession은 토큰·변경 강제 여부를 두고 authenticated로 만든다', () => {
    useAuthStore.getState().setSession({
      accessToken: 't',
      tokenType: 'Bearer',
      accountStatus: 'ACTIVE',
      mustChangePassword: true,
    });
    expect(useAuthStore.getState()).toMatchObject({
      status: 'authenticated',
      accessToken: 't',
      mustChangePassword: true,
    });
  });

  it('clear는 anonymous로 되돌린다', () => {
    useAuthStore.getState().setSession({
      accessToken: 't',
      tokenType: 'Bearer',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
    });
    useAuthStore.getState().clear();
    expect(useAuthStore.getState()).toMatchObject({
      status: 'anonymous',
      accessToken: null,
      mustChangePassword: false,
    });
  });
});
