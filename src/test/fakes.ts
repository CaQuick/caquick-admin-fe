/**
 * 외부 스크립트(카카오 우편번호·네이버 지도)의 가짜. jsdom은 실제 스크립트를 받지도 그리지도 못한다.
 * 로더는 window에 객체가 이미 있으면 스크립트를 넣지 않으므로, 여기서 넣어 두면 네트워크 없이 동작한다.
 */
import {
  type PostcodeConstructor,
  type PostcodeOptions,
  type RawPostcodeData,
} from '@/shared/lib/kakao-postcode';
import { type NaverLatLng, type NaverMapsApi } from '@/shared/lib/naver-maps';

/** 우편번호 검색 창 대신 '<도로명>' 버튼을 그린다. 누르면 그 결과를 고른 것으로 넘긴다 */
export function installFakePostcode(result: RawPostcodeData) {
  class FakePostcode {
    private options: PostcodeOptions;
    constructor(options: PostcodeOptions) {
      this.options = options;
    }
    embed(el: HTMLElement) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = result.roadAddress || result.jibunAddress;
      button.addEventListener('click', () => this.options.oncomplete(result));
      el.appendChild(button);
    }
  }
  window.kakao = { Postcode: FakePostcode as unknown as PostcodeConstructor };
}

export function postcodeResult(over: Partial<RawPostcodeData> = {}): RawPostcodeData {
  return {
    roadAddress: '서울 강남구 테헤란로 152',
    jibunAddress: '서울 강남구 역삼동 737',
    sido: '서울',
    sigungu: '강남구',
    bname: '역삼동',
    sigunguCode: '11680',
    zonecode: '06236',
    ...over,
  };
}

class FakeLatLng implements NaverLatLng {
  private readonly la: number;
  private readonly ln: number;
  constructor(lat: number, lng: number) {
    this.la = lat;
    this.ln = lng;
  }
  lat() {
    return this.la;
  }
  lng() {
    return this.ln;
  }
}

interface Listener {
  target: object;
  name: string;
  handler: (e?: { coord?: NaverLatLng }) => void;
}

/** naver.maps의 쓰는 부분만. 만든 지도·핀과 등록된 이벤트를 들여다보고 이벤트를 발화할 수 있다 */
export function installFakeNaverMaps() {
  const maps: FakeMap[] = [];
  const markers: FakeMarker[] = [];
  const listeners = new Set<Listener>();

  class FakeMap {
    center: NaverLatLng;
    panTo = vi.fn();
    destroy = vi.fn();
    constructor(_el: HTMLElement, options: { center: NaverLatLng }) {
      this.center = options.center;
      maps.push(this);
    }
  }
  class FakeMarker {
    position: NaverLatLng;
    map: FakeMap | null;
    draggable: boolean;
    constructor(o: { position: NaverLatLng; map?: FakeMap | null; draggable?: boolean }) {
      this.position = o.position;
      this.map = o.map ?? null;
      this.draggable = o.draggable ?? false;
      markers.push(this);
    }
    setPosition(p: NaverLatLng) {
      this.position = p;
    }
    getPosition() {
      return this.position;
    }
    setMap(m: FakeMap | null) {
      this.map = m;
    }
  }

  window.naver = {
    maps: {
      Map: FakeMap,
      Marker: FakeMarker,
      LatLng: FakeLatLng,
      Point: class {},
      Event: {
        addListener: (target: object, name: string, handler: Listener['handler']) => {
          const l = { target, name, handler };
          listeners.add(l);
          return l;
        },
        removeListener: (l: object) => listeners.delete(l as Listener),
      },
    } as unknown as NaverMapsApi,
  };

  const fire = (target: object, name: string, e?: { coord?: NaverLatLng }) => {
    for (const l of listeners) if (l.target === target && l.name === name) l.handler(e);
  };
  return {
    maps,
    markers,
    listeners,
    latLng: (lat: number, lng: number) => new FakeLatLng(lat, lng),
    /** 마지막 핀을 옮기고 드래그를 끝낸다 */
    drag(lat: number, lng: number) {
      const marker = markers.at(-1)!;
      marker.setPosition(new FakeLatLng(lat, lng));
      fire(marker, 'dragend');
    },
    /** 마지막 지도를 누른다 */
    click(lat: number, lng: number) {
      fire(maps.at(-1)!, 'click', { coord: new FakeLatLng(lat, lng) });
    },
  };
}
