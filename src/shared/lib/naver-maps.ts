/**
 * 네이버 지도(Dynamic Map v3). 구매자 앱과 같은 지도라 관리자가 보는 핀 위치가 구매자 화면과 일치한다.
 * CSP: script-src https://oapi.map.naver.com(본체·인증 JSONP)·https://nrbe.pstatic.net(스타일 JSONP),
 * connect-src https://kr-col-ext.nelo.navercorp.com(스크립트 자체 오류 수집). 타일·아이콘은 img-src https:.
 */
export const NAVER_MAP_SCRIPT_ORIGIN = 'https://oapi.map.naver.com';

export function naverMapScriptUrl(keyId: string): string {
  return `${NAVER_MAP_SCRIPT_ORIGIN}/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(keyId)}`;
}

/** 빌드 때 넣은 지도 키. 없거나 공백이면 undefined(지도 없이 동작). 호출할 때 읽어야 테스트의 stubEnv가 먹는다 */
export function naverMapKeyId(): string | undefined {
  const raw = import.meta.env.VITE_NAVER_MAP_CLIENT_ID as string | undefined;
  const key = raw?.trim();
  return key === '' ? undefined : key;
}

/** 좌표가 없을 때 보여 줄 중심(서울시청) */
export const DEFAULT_MAP_CENTER = { lat: 37.5666805, lng: 126.9784147 };

// 쓰는 기능만 적은 타입. 테스트는 이 모양의 가짜 객체를 window.naver.maps에 넣는다
export interface NaverLatLng {
  lat: () => number;
  lng: () => number;
}
export type NaverListener = object;
export interface NaverMap {
  panTo: (p: NaverLatLng) => void;
  destroy: () => void;
}
export interface NaverMarker {
  setPosition: (p: NaverLatLng) => void;
  getPosition: () => NaverLatLng;
  setMap: (map: NaverMap | null) => void;
}
export interface NaverMapsApi {
  Map: new (
    el: HTMLElement,
    options: { center: NaverLatLng; zoom: number; zoomControl?: boolean },
  ) => NaverMap;
  Marker: new (options: {
    position: NaverLatLng;
    map?: NaverMap | null;
    draggable?: boolean;
    icon?: { content: string; anchor: object };
  }) => NaverMarker;
  LatLng: new (lat: number, lng: number) => NaverLatLng;
  Point: new (x: number, y: number) => object;
  Event: {
    addListener: (
      target: NaverMap | NaverMarker,
      name: string,
      handler: (e?: { coord?: NaverLatLng }) => void,
    ) => NaverListener;
    removeListener: (listener: NaverListener) => void;
  };
}

declare global {
  interface Window {
    naver?: { maps?: NaverMapsApi };
    /** 인증 실패(키·Web 서비스 URL 불일치) 때 스크립트가 부르는 전역 훅 */
    navermap_authFailure?: () => void;
  }
}

/** CDN이 멈추면 load·error가 오지 않는다. 이만큼 기다린 뒤 실패로 보고 다시 시도하게 한다 */
export const NAVER_MAP_TIMEOUT_MS = 10_000;

let loading: Promise<NaverMapsApi> | null = null;

/** 스크립트를 처음 쓸 때 한 번만 받는다. 실패하면 다음 호출에서 다시 시도한다. */
export function loadNaverMaps(keyId: string): Promise<NaverMapsApi> {
  const ready = window.naver?.maps;
  if (ready) return Promise.resolve(ready);
  loading ??= new Promise<NaverMapsApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = naverMapScriptUrl(keyId);
    script.async = true;
    const timer = setTimeout(
      () => fail(new Error('지도 스크립트가 응답하지 않습니다.')),
      NAVER_MAP_TIMEOUT_MS,
    );
    script.onload = () => {
      const maps = window.naver?.maps;
      if (!maps) return fail(new Error('지도 스크립트에 naver.maps가 없습니다.'));
      clearTimeout(timer);
      loading = null;
      resolve(maps);
    };
    script.onerror = () => fail(new Error('지도 스크립트를 불러오지 못했습니다.'));
    function fail(error: Error) {
      clearTimeout(timer);
      // 시간 초과 뒤 늦게 오는 load가 다음 시도의 loading을 지우지 않게 끊는다
      script.onload = null;
      script.onerror = null;
      script.remove();
      loading = null;
      reject(error);
    }
    document.head.appendChild(script);
  });
  return loading;
}

const authFailureListeners = new Set<() => void>();
let authFailed = false;

/**
 * 인증 실패를 구독한다. 전역 훅은 하나라 한 번만 설치하고 구독자에게 나눠 준다.
 * 이미 실패했으면 바로 알린다(실패는 페이지를 새로 열 때까지 유지된다). 해제 함수를 돌려준다.
 */
export function onNaverMapAuthFailure(listener: () => void): () => void {
  window.navermap_authFailure ??= () => {
    authFailed = true;
    authFailureListeners.forEach((l) => l());
  };
  authFailureListeners.add(listener);
  if (authFailed) listener();
  return () => {
    authFailureListeners.delete(listener);
  };
}

/** 테스트 전용: 모듈 상태를 처음으로 되돌린다 */
export function resetNaverMapsForTest() {
  loading = null;
  authFailed = false;
  authFailureListeners.clear();
  delete window.navermap_authFailure;
}
