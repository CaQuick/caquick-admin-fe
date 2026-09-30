import { z } from 'zod';

import {
  type MapProvider,
  addressFromPostcode,
  kakaoMapLink,
  mapProviderWarning,
  refineCoordPair,
  storeLocationShape,
} from './location-schema';

const schema = z.object(storeLocationShape).superRefine(refineCoordPair);
const base = {
  addressFull: '서울 강남구 테헤란로 152',
  addressCity: '서울',
  addressDistrict: '강남구',
  addressNeighborhood: '역삼동',
  regionId: '5',
  latitude: '37.5000242',
  longitude: '127.0365717',
  mapProvider: 'NAVER' as MapProvider,
};

describe('storeLocationShape', () => {
  it.each([
    ['37.5', '127', true],
    ['', '', true],
    [' 37.5 ', ' 127 ', true],
    ['37.5', '', false],
    ['', '127', false],
    ['90.1', '127', false],
    ['37.5', '-180.1', false],
    ['0x10', '127', false],
  ])('위도 %j · 경도 %j → %s', (latitude, longitude, ok) => {
    expect(schema.safeParse({ ...base, latitude, longitude }).success).toBe(ok);
  });

  it('위도·경도 중 비어 있는 쪽에 오류를 단다', () => {
    const onlyLat = schema.safeParse({ ...base, longitude: '' });
    expect(onlyLat.error?.issues).toEqual([
      expect.objectContaining({
        path: ['longitude'],
        message: '위도와 경도를 함께 입력해 주세요.',
      }),
    ]);
    const onlyLng = schema.safeParse({ ...base, latitude: ' ' });
    expect(onlyLng.error?.issues.map((i) => i.path)).toEqual([['latitude']]);
  });

  it.each(['NAVER', 'KAKAO', 'NONE'])('지도 제공자 %s 를 받는다', (mapProvider) => {
    expect(schema.safeParse({ ...base, mapProvider }).success).toBe(true);
  });

  it('주소는 비울 수 없다', () => {
    expect(schema.safeParse({ ...base, addressFull: '  ' }).error?.issues[0]?.message).toBe(
      '주소는 필수입니다.',
    );
  });
});

describe('mapProviderWarning', () => {
  const NO_COORDS = /좌표가 없어/;
  const UNUSED = /사용 안 함/;
  it.each<[string, string, MapProvider, RegExp | null]>([
    ['37.5', '127', 'NAVER', null],
    ['37.5', '127', 'KAKAO', null],
    ['37.5', '127', 'NONE', UNUSED],
    ['', '', 'NONE', null],
    ['', '', 'NAVER', NO_COORDS],
    ['', '', 'KAKAO', NO_COORDS],
    // 한쪽만 있거나 틀린 좌표는 구매자 앱이 쓸 수 없다
    ['37.5', '', 'NAVER', NO_COORDS],
    ['abc', '127', 'KAKAO', NO_COORDS],
    ['37.5', '', 'NONE', null],
  ])('위도 %j · 경도 %j · %s → %s', (lat, lng, provider, expected) => {
    const w = mapProviderWarning(lat, lng, provider);
    if (expected === null) expect(w).toBeNull();
    else expect(w).toMatch(expected);
  });
});

describe('addressFromPostcode', () => {
  const r = {
    roadAddress: '서울 강남구 테헤란로 152',
    jibunAddress: '서울 강남구 역삼동 737',
    sido: '서울',
    sigungu: '강남구',
    bname: '역삼동',
  };
  it('도로명 주소와 시·도·시군구·동을 채운다', () => {
    expect(addressFromPostcode(r)).toEqual({
      addressFull: '서울 강남구 테헤란로 152',
      addressCity: '서울',
      addressDistrict: '강남구',
      addressNeighborhood: '역삼동',
    });
  });
  it('도로명이 없으면 지번 주소를 쓴다', () => {
    expect(addressFromPostcode({ ...r, roadAddress: '' }).addressFull).toBe(
      '서울 강남구 역삼동 737',
    );
  });
});

describe('kakaoMapLink', () => {
  it.each([
    [
      '루미 케이크',
      'https://map.kakao.com/link/map/%EB%A3%A8%EB%AF%B8%20%EC%BC%80%EC%9D%B4%ED%81%AC,37.5,127',
    ],
    ['a,b/c', 'https://map.kakao.com/link/map/a%2Cb%2Fc,37.5,127'],
  ])('%j → %s(이름의 쉼표·슬래시는 인코딩)', (name, url) => {
    expect(kakaoMapLink(name, '37.5', '127')).toBe(url);
  });
});
