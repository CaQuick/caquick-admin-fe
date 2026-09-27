import { getSessionHooks, refreshOnce, registerSessionHooks } from './session';

describe('session hooks', () => {
  afterEach(() => {
    registerSessionHooks({ getAccessToken: () => null, refresh: () => Promise.resolve(false) });
  });

  it('등록 전에는 토큰이 없고 refresh는 실패로 끝난다', async () => {
    expect(getSessionHooks().getAccessToken()).toBeNull();
    await expect(refreshOnce()).resolves.toBe(false);
  });

  it('동시에 여러 번 불러도 refresh는 한 번만 돈다', async () => {
    let calls = 0;
    let release!: (v: boolean) => void;
    registerSessionHooks({
      getAccessToken: () => 'tok',
      refresh: () => {
        calls += 1;
        return new Promise<boolean>((r) => {
          release = r;
        });
      },
    });
    const a = refreshOnce();
    const b = refreshOnce();
    release(true);
    await expect(Promise.all([a, b])).resolves.toEqual([true, true]);
    expect(calls).toBe(1);

    // 끝난 뒤에는 다시 돈다
    const c = refreshOnce();
    release(false);
    await expect(c).resolves.toBe(false);
    expect(calls).toBe(2);
  });
});
