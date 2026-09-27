import { applyTheme, initTheme, resolveTheme, useThemeStore } from './theme-store';

describe('theme-store', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    useThemeStore.setState({ theme: 'system', resolved: 'light' });
  });

  it.each([
    ['light', true, 'light'],
    ['dark', false, 'dark'],
    ['system', true, 'dark'],
    ['system', false, 'light'],
  ] as const)('resolveTheme(%s, prefersDark=%s) → %s', (theme, prefersDark, expected) => {
    expect(resolveTheme(theme, prefersDark)).toBe(expected);
  });

  it('setTheme는 저장하고 문서 루트에 .dark를 토글한다', () => {
    useThemeStore.getState().setTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('caquick-admin.theme')).toBe('dark');
    expect(useThemeStore.getState().resolved).toBe('dark');

    useThemeStore.getState().setTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('applyTheme는 color-scheme도 맞춘다', () => {
    expect(applyTheme('dark')).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('initTheme는 matchMedia가 없어도 죽지 않는다', () => {
    const original = window.matchMedia;
    // jsdom에는 matchMedia가 없다 — 있는 환경도 시뮬레이션
    Object.defineProperty(window, 'matchMedia', { value: undefined, configurable: true });
    expect(() => initTheme()).not.toThrow();
    Object.defineProperty(window, 'matchMedia', { value: original, configurable: true });
  });

  it('system이면 OS 테마 변경을 따라간다', () => {
    let listener: (() => void) | undefined;
    let matches = false;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({
        get matches() {
          return matches;
        },
        addEventListener: (_: string, cb: () => void) => {
          listener = cb;
        },
      }),
    });
    initTheme();
    matches = true;
    listener?.();
    expect(useThemeStore.getState().resolved).toBe('dark');
  });
});
