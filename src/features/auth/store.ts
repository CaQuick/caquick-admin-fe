import { create } from 'zustand';

import { type LoginResponse } from './api/auth-api';

export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous';

interface AuthState {
  status: SessionStatus;
  /** 메모리에만 둔다 — 새 탭은 refresh 쿠키로 복원한다. */
  accessToken: string | null;
  mustChangePassword: boolean;
  setSession: (res: LoginResponse) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'unknown',
  accessToken: null,
  mustChangePassword: false,
  setSession: (res) =>
    set({
      status: 'authenticated',
      accessToken: res.accessToken,
      mustChangePassword: res.mustChangePassword,
    }),
  clear: () => set({ status: 'anonymous', accessToken: null, mustChangePassword: false }),
}));
