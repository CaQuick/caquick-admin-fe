import { type Region } from './schema';

/** 매장이 연결되는 지역: 2단계(시·군·구) */
const isDistrict = (r: Region) => r.level === 2;

/** '서울 강남구'처럼 권역 이름을 앞에 붙인 이름. 모르는 ID면 undefined */
export function regionLabel(regions: readonly Region[], id: string): string | undefined {
  const region = regions.find((r) => r.id === id);
  if (!region) return undefined;
  const parent = region.parentId ? regions.find((r) => r.id === region.parentId) : undefined;
  return parent ? `${parent.name} ${region.name}` : region.name;
}

/**
 * 우편번호 결과의 시군구 코드로 매장 지역을 찾는다. 지역 slug 규약이 'sgg-<시군구코드>'다(BE 지오코딩과 같은 규칙).
 * 숨긴 지역은 매장에 연결할 수 없어(BE가 거절) 고르지 않는다.
 */
export function matchRegionBySigunguCode(
  regions: readonly Region[],
  sigunguCode: string,
): Region | undefined {
  if (!/^\d{5}$/.test(sigunguCode)) return undefined;
  const slug = `sgg-${sigunguCode}`;
  return regions.find((r) => isDistrict(r) && r.isActive && r.slug === slug);
}

/** 권역 목록(정렬은 BE 순서 그대로) */
export function areasOf(regions: readonly Region[]): Region[] {
  return regions.filter((r) => r.level === 1);
}

/**
 * 권역 아래 고를 수 있는 시·군·구. activeOnly면 숨긴 지역은 빼되, 이미 연결된 지역(currentId)은 그대로 보여 준다.
 */
export function districtsOf(
  regions: readonly Region[],
  areaId: string,
  { activeOnly, currentId }: { activeOnly: boolean; currentId?: string },
): Region[] {
  return regions.filter(
    (r) =>
      isDistrict(r) && r.parentId === areaId && (!activeOnly || r.isActive || r.id === currentId),
  );
}

/** 삭제를 막는 연결 수. 시·군·구는 매장 수, 권역은 숨긴 것까지 센 하위 지역 수(BE가 숨긴 하위도 막는다) */
export function blockingCount(regions: readonly Region[], region: Region): number {
  if (isDistrict(region)) return region.storeCount;
  return regions.filter((r) => r.parentId === region.id).length;
}
