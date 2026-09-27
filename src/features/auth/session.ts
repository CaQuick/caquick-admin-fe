import { refreshOnce, registerSessionHooks } from '@/shared/api';

import { authApi } from './api/auth-api';
import { type SessionStatus, useAuthStore } from './store';

/** 요청 계층에 토큰·갱신을 연결한다. 앱 부팅 시 1회. */
export function installSessionHooks(): void {
  registerSessionHooks({
    getAccessToken: () => useAuthStore.getState().accessToken,
    refresh: async () => {
      try {
        useAuthStore.getState().setSession(await authApi.refresh());
        return true;
      } catch {
        useAuthStore.getState().clear();
        return false;
      }
    },
  });
}

/** 세션 상태를 확정한다. 아직 모르면(첫 진입·새 탭) refresh로 복원을 시도한다. */
export async function ensureSession(): Promise<SessionStatus> {
  const { status } = useAuthStore.getState();
  if (status !== 'unknown') return status;
  await refreshOnce();
  return useAuthStore.getState().status;
}

export async function login(username: string, password: string): Promise<void> {
  const res = await authApi.login({ username, password });
  useAuthStore.getState().setSession(res);
}

/** 서버 세션을 끝내고 스토어를 비운다. 서버가 이미 세션을 모르거나(401) 닿지 않아도 로컬은 비운다. */
export async function logout(): Promise<void> {
  try {
    await authApi.logout();
  } catch {
    // 로컬 정리가 우선 — 서버 쪽 세션은 만료로 정리된다
  } finally {
    useAuthStore.getState().clear();
  }
}

/** 성공하면 BE가 기존 토큰을 무효화하므로 로컬도 비운다 — 호출자는 로그인 화면으로 보낸다. */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await authApi.changePassword({ currentPassword, newPassword });
  useAuthStore.getState().clear();
}
