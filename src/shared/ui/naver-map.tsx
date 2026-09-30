import { type ReactNode, useEffect, useRef, useState } from 'react';

import { toCoordString } from '@/shared/lib/coords';
import {
  DEFAULT_MAP_CENTER,
  type NaverListener,
  type NaverMap as NaverMapInstance,
  type NaverMapsApi,
  type NaverMarker,
  loadNaverMaps,
  naverMapKeyId,
  onNaverMapAuthFailure,
} from '@/shared/lib/naver-maps';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

interface Props {
  /** 핀 위치. null이면 기본 중심에 핀 없이 보여 준다 */
  position: { lat: number; lng: number } | null;
  /** 있으면 핀을 끌거나 지도를 눌러 옮길 수 있다. 소수 7자리 문자열로 넘긴다 */
  onMove?: (lat: string, lng: string) => void;
  /** 지도 영역의 접근 이름 */
  label: string;
  className?: string;
}

type Status = 'loading' | 'ready' | 'load-error' | 'auth-error';

// 핀은 토큰 색으로 그린다(hex 금지). 가운데가 좌표라 anchor는 반지름
const PIN_SIZE = 20;
const PIN_HTML = `<span class="block size-5 rounded-full border-2 border-background bg-primary shadow-md"></span>`;

/** 네이버 지도 미리보기. 지도 키가 없거나 불러오지 못해도 폼은 그대로 쓸 수 있게 안내만 보여 준다. */
export function NaverMap({ position, onMove, label, className }: Props) {
  const keyId = naverMapKeyId();
  if (!keyId) {
    return (
      <MapNotice className={className}>
        <p>지도 미리보기를 쓸 수 없습니다. 지도 키가 설정되지 않았습니다.</p>
        {import.meta.env.DEV && (
          <p className="text-xs">.env.local에 VITE_NAVER_MAP_CLIENT_ID를 넣어 주세요.</p>
        )}
      </MapNotice>
    );
  }
  return (
    <LoadedMap
      keyId={keyId}
      position={position}
      onMove={onMove}
      label={label}
      className={className}
    />
  );
}

function LoadedMap({ keyId, position, onMove, label, className }: Props & { keyId: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [attempt, setAttempt] = useState(0);
  const api = useRef<{ maps: NaverMapsApi; map: NaverMapInstance; marker: NaverMarker } | null>(
    null,
  );
  // 지도 이벤트는 늘 최신 onMove·position을 본다(지도를 다시 만들지 않는다)
  const latest = useRef({ onMove, position });
  useEffect(() => {
    latest.current = { onMove, position };
  });
  const editable = onMove !== undefined;

  useEffect(() => onNaverMapAuthFailure(() => setStatus('auth-error')), []);

  useEffect(() => {
    let cancelled = false;
    const listeners: NaverListener[] = [];
    loadNaverMaps(keyId).then(
      (maps) => {
        const el = container.current;
        if (cancelled || !el) return;
        const start = latest.current.position ?? DEFAULT_MAP_CENTER;
        const center = new maps.LatLng(start.lat, start.lng);
        const map = new maps.Map(el, { center, zoom: 16, zoomControl: true });
        const marker = new maps.Marker({
          position: center,
          map: latest.current.position ? map : null,
          draggable: editable,
          icon: { content: PIN_HTML, anchor: new maps.Point(PIN_SIZE / 2, PIN_SIZE / 2) },
        });
        const report = (p: { lat: () => number; lng: () => number }) =>
          latest.current.onMove?.(toCoordString(p.lat()), toCoordString(p.lng()));
        if (editable) {
          listeners.push(
            maps.Event.addListener(marker, 'dragend', () => report(marker.getPosition())),
            maps.Event.addListener(map, 'click', (e) => {
              if (!e?.coord) return;
              marker.setPosition(e.coord);
              marker.setMap(map);
              report(e.coord);
            }),
          );
        }
        api.current = { maps, map, marker };
        setStatus((s) => (s === 'auth-error' ? s : 'ready'));
      },
      () => {
        if (!cancelled) setStatus('load-error');
      },
    );
    return () => {
      cancelled = true;
      const current = api.current;
      api.current = null;
      if (!current) return;
      listeners.forEach((l) => current.maps.Event.removeListener(l));
      current.marker.setMap(null);
      current.map.destroy();
    };
  }, [keyId, attempt, editable]);

  // 칸에 적은 좌표·주소 검색 결과를 핀에 옮긴다. onMove는 부르지 않는다(되먹임 방지)
  const lat = position?.lat;
  const lng = position?.lng;
  useEffect(() => {
    const current = api.current;
    if (!current || status !== 'ready') return;
    if (lat === undefined || lng === undefined) {
      current.marker.setMap(null);
      return;
    }
    const p = new current.maps.LatLng(lat, lng);
    current.marker.setPosition(p);
    current.marker.setMap(current.map);
    current.map.panTo(p);
  }, [lat, lng, status]);

  return (
    <div
      className={cn('relative h-64 overflow-hidden rounded-md border', className)}
      role="region"
      aria-label={label}
    >
      <div ref={container} className="size-full" />
      {status === 'loading' && (
        <p className="absolute inset-0 grid place-items-center bg-surface-tint text-sm text-muted-foreground">
          지도를 불러오고 있습니다.
        </p>
      )}
      {status === 'load-error' && (
        <div
          role="alert"
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background text-sm"
        >
          <p>지도를 불러오지 못했습니다.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setStatus('loading');
              setAttempt((n) => n + 1);
            }}
          >
            다시 시도
          </Button>
        </div>
      )}
      {status === 'auth-error' && (
        <p
          role="alert"
          className="absolute inset-0 grid place-items-center bg-background px-6 text-center text-sm"
        >
          지도 인증에 실패했습니다. 네이버 클라우드 콘솔의 Web 서비스 URL에 이 주소가 등록돼 있는지
          확인해 주세요.
        </p>
      )}
      {status === 'ready' && editable && position === null && (
        <p className="pointer-events-none absolute inset-x-0 top-2 mx-auto w-fit rounded-md bg-background/90 px-3 py-1 text-xs shadow-sm">
          주소를 검색해 좌표를 채우거나 지도를 눌러 핀을 놓아 주세요.
        </p>
      )}
    </div>
  );
}

function MapNotice({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex h-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed bg-surface-tint px-4 text-center text-sm text-muted-foreground',
        className,
      )}
    >
      {children}
    </div>
  );
}
