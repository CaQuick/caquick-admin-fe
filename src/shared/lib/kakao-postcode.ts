/**
 * 카카오(다음) 우편번호 서비스. 키가 필요 없고, 스크립트가 postcode.map.kakao.com iframe을 만들어 결과를 postMessage로 넘긴다.
 * CSP: script-src https://t1.kakaocdn.net, frame-src https://postcode.map.kakao.com (infra/security-headers.inc).
 */
export const POSTCODE_SCRIPT_URL =
  'https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

/** 주소 검색 결과 중 매장 주소 입력에 쓰는 값 */
export interface PostcodeResult {
  /** 도로명 주소(지번을 골라도 대응 도로명이 있으면 그것) */
  roadAddress: string;
  jibunAddress: string;
  /** 시·도(예: '서울') */
  sido: string;
  /** 시·군·구(예: '강남구', '성남시 분당구') */
  sigungu: string;
  /** 법정동·법정리 이름 */
  bname: string;
  /** 시·군·구 코드 5자리. 지역 자동 매칭에 쓴다 */
  sigunguCode: string;
  /** 우편번호 5자리 */
  zonecode: string;
}

/** 스크립트가 넘기는 원본 중 쓰는 필드. 지번을 고르면 roadAddress가 비고 autoRoadAddress에 대응 도로명이 온다 */
export interface RawPostcodeData {
  roadAddress: string;
  autoRoadAddress?: string;
  jibunAddress: string;
  autoJibunAddress?: string;
  sido: string;
  sigungu: string;
  bname: string;
  sigunguCode: string;
  zonecode: string;
}

export interface PostcodeOptions {
  oncomplete: (data: RawPostcodeData) => void;
  width?: string | number;
  height?: string | number;
}

interface PostcodeInstance {
  embed: (element: HTMLElement, options?: { autoClose?: boolean; q?: string }) => void;
}

export type PostcodeConstructor = new (options: PostcodeOptions) => PostcodeInstance;

declare global {
  interface Window {
    kakao?: { Postcode?: PostcodeConstructor };
  }
}

/** 빈 문자열도 '없음'으로 본다(스크립트는 없는 값을 ''로 준다) */
const orAuto = (value: string, auto: string | undefined) => (value !== '' ? value : (auto ?? ''));

export function toPostcodeResult(data: RawPostcodeData): PostcodeResult {
  return {
    roadAddress: orAuto(data.roadAddress, data.autoRoadAddress),
    jibunAddress: orAuto(data.jibunAddress, data.autoJibunAddress),
    sido: data.sido,
    sigungu: data.sigungu,
    bname: data.bname,
    sigunguCode: data.sigunguCode,
    zonecode: data.zonecode,
  };
}

let loading: Promise<PostcodeConstructor> | null = null;

/** 스크립트를 처음 쓸 때 한 번만 받는다. 실패하면 다음 호출에서 다시 시도한다. */
export function loadPostcode(): Promise<PostcodeConstructor> {
  const ready = window.kakao?.Postcode;
  if (ready) return Promise.resolve(ready);
  loading ??= new Promise<PostcodeConstructor>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = POSTCODE_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      const ctor = window.kakao?.Postcode;
      if (!ctor) return fail(new Error('우편번호 스크립트에 Postcode가 없습니다.'));
      // 이후 호출은 window.kakao를 바로 쓴다
      loading = null;
      resolve(ctor);
    };
    script.onerror = () => fail(new Error('우편번호 스크립트를 불러오지 못했습니다.'));
    function fail(error: Error) {
      script.remove();
      loading = null;
      reject(error);
    }
    document.head.appendChild(script);
  });
  return loading;
}
