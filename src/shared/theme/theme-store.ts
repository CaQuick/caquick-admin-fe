import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'caquick-admin.theme';

function readStored(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function resolveTheme(theme: Theme, prefersDark: boolean): 'light' | 'dark' {
  if (theme === 'system') return prefersDark ? 'dark' : 'light';
  return theme;
}

function prefersDark(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
}

/** 문서 루트에 .dark를 토글한다 — Tailwind @custom-variant dark가 이 클래스를 본다. */
export function applyTheme(theme: Theme): 'light' | 'dark' {
  const resolved = resolveTheme(theme, prefersDark());
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.style.colorScheme = resolved;
  return resolved;
}

interface ThemeState {
  theme: Theme;
  resolved: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: readStored(),
  resolved: resolveTheme(readStored(), prefersDark()),
  setTheme: (theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // 저장 실패는 무시 — 세션 동안만 유지
    }
    set({ theme, resolved: applyTheme(theme) });
  },
}));

/** 부팅 시 1회 — 저장값 적용 + OS 테마 변경 추적(system일 때만). */
export function initTheme(): void {
  applyTheme(useThemeStore.getState().theme);
  if (typeof matchMedia !== 'function') return;
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { theme } = useThemeStore.getState();
    if (theme === 'system') useThemeStore.setState({ resolved: applyTheme(theme) });
  });
}
