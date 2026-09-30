import { z } from 'zod';

import { LATITUDE_RANGE, LONGITUDE_RANGE, parseCoord, parseCoordPair } from '@/shared/lib/coords';
import { withJosa } from '@/shared/lib/josa';

/** BE store-field-limits. BE는 trim 뒤 코드 포인트로 센다. */
const STORE_ADDRESS_MAX = {
  addressFull: 500,
  addressCity: 50,
  addressDistrict: 80,
  addressNeighborhood: 80,
} as const;

export const maxChars = (max: number) =>
  z
    .string()
    .trim()
    .refine((v) => [...v].length <= max, `${max}자 이하로 입력해 주세요.`);

const coordText = (name: string, range: { min: number; max: number }) =>
  z
    .string()
    .trim()
    .refine(
      (v) => v === '' || parseCoord(v, range) !== null,
      `${withJosa(name, '은/는')} ${range.min}~${range.max} 사이 숫자로 입력해 주세요.`,
    );

const MAP_PROVIDERS = ['NAVER', 'KAKAO', 'NONE'] as const;
export type MapProvider = (typeof MAP_PROVIDERS)[number];

/** 매장 수정·판매자 등록이 함께 쓰는 주소·위치 칸. 빈 문자열은 '없음'이다. */
export const storeLocationShape = {
  addressFull: maxChars(STORE_ADDRESS_MAX.addressFull).refine(
    (v) => v.length > 0,
    '주소는 필수입니다.',
  ),
  addressCity: maxChars(STORE_ADDRESS_MAX.addressCity),
  addressDistrict: maxChars(STORE_ADDRESS_MAX.addressDistrict),
  addressNeighborhood: maxChars(STORE_ADDRESS_MAX.addressNeighborhood),
  regionId: z.string().trim(),
  latitude: coordText('위도', LATITUDE_RANGE),
  longitude: coordText('경도', LONGITUDE_RANGE),
  mapProvider: z.enum(MAP_PROVIDERS),
};

export type StoreLocationValues = {
  [K in keyof typeof storeLocationShape]: z.infer<(typeof storeLocationShape)[K]>;
};

/** 위도·경도 중 하나만 있으면 구매자 앱이 위치를 쓸 수 없다. 빈 칸 쪽에 오류를 단다 */
export function refineCoordPair(v: { latitude: string; longitude: string }, ctx: z.RefinementCtx) {
  const lat = v.latitude.trim();
  const lng = v.longitude.trim();
  if ((lat === '') === (lng === '')) return;
  ctx.addIssue({
    code: 'custom',
    path: [lat === '' ? 'latitude' : 'longitude'],
    message: '위도와 경도를 함께 입력해 주세요.',
  });
}

export const MAP_PROVIDER_OPTIONS: { value: MapProvider; label: string; description: string }[] = [
  {
    value: 'NAVER',
    label: '네이버 지도',
    description: '구매자 앱 매장 화면에 지도와 네이버 길찾기를 보여 줍니다.',
  },
  {
    value: 'KAKAO',
    label: '카카오맵',
    description: '앱 안에는 지도가 없고, 길찾기를 누르면 카카오맵으로 이동합니다.',
  },
  {
    value: 'NONE',
    label: '사용 안 함',
    description: "위치 버튼이 꺼지고 '위치 정보가 없습니다'로 보입니다.",
  },
];

export const MAP_PROVIDER_LABEL: Record<MapProvider, string> = {
  NAVER: '네이버 지도',
  KAKAO: '카카오맵',
  NONE: '사용 안 함',
};

/** 좌표와 지도 제공자가 서로 맞지 않을 때의 경고. 맞으면 null */
export function mapProviderWarning(
  latitude: string,
  longitude: string,
  provider: MapProvider,
): string | null {
  const hasCoords = parseCoordPair(latitude, longitude) !== null;
  if (hasCoords && provider === 'NONE') {
    return "좌표가 있지만 지도 제공자가 '사용 안 함'이라 구매자 앱에 위치가 나오지 않습니다.";
  }
  if (!hasCoords && provider !== 'NONE') {
    return '좌표가 없어 구매자 앱에서 지도와 길찾기가 동작하지 않습니다. 주소를 검색하거나 좌표를 입력해 주세요.';
  }
  return null;
}

/** 우편번호 결과 중 주소 칸에 넣는 값. 도로명이 없으면 지번 주소를 쓴다 */
export function addressFromPostcode(r: {
  roadAddress: string;
  jibunAddress: string;
  sido: string;
  sigungu: string;
  bname: string;
}) {
  return {
    addressFull: r.roadAddress || r.jibunAddress,
    addressCity: r.sido,
    addressDistrict: r.sigungu,
    addressNeighborhood: r.bname,
  };
}

/** 카카오맵 외부 링크(D5). 이름은 핀 말풍선에 보인다 */
export function kakaoMapLink(name: string, lat: string, lng: string): string {
  return `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lng}`;
}
