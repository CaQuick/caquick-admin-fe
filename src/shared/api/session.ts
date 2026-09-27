/**
 * 요청 계층이 인증 계층을 모른 채 토큰을 붙이고 만료를 처리하게 하는 접점.
 * auth feature가 부팅 시 register한다. 등록 전에는 토큰 없음·갱신 실패로 동작한다.
 */
export interface SessionHooks {
  getAccessToken: () => string | null;
  /** 401·UNAUTHENTICATED에서 1회 호출. 새 토큰을 얻으면 true — 호출자는 요청을 한 번 더 보낸다. */
  refresh: () => Promise<boolean>;
}

let hooks: SessionHooks = {
  getAccessToken: () => null,
  refresh: () => Promise.resolve(false),
};

export function registerSessionHooks(next: SessionHooks): void {
  hooks = next;
}

export function getSessionHooks(): SessionHooks {
  return hooks;
}

/** 동시에 여러 요청이 만료를 만나도 refresh는 한 번만 — 같은 promise를 공유한다. */
let inflight: Promise<boolean> | null = null;
export function refreshOnce(): Promise<boolean> {
  inflight ??= hooks.refresh().finally(() => {
    inflight = null;
  });
  return inflight;
}
