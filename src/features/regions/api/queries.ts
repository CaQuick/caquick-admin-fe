import { type QueryClient, queryOptions } from '@tanstack/react-query';

import { graphql } from '@/graphql/generated';
import {
  type AdminCreateRegionInput,
  type AdminRegionListInput,
  type AdminUpdateRegionInput,
} from '@/graphql/generated/graphql';
import { gqlRequest } from '@/shared/api';

const regionsKeys = {
  all: ['regions'] as const,
  list: (input: AdminRegionListInput) => [...regionsKeys.all, 'list', input] as const,
  geocode: (query: string) => [...regionsKeys.all, 'geocode', query] as const,
};

const AdminRegionsDocument = graphql(/* GraphQL */ `
  query AdminRegions($input: AdminRegionListInput) {
    adminRegions(input: $input) {
      id
      parentId
      level
      name
      slug
      sortOrder
      isActive
      centerLat
      centerLng
      storeCount
      childCount
      createdAt
      updatedAt
    }
  }
`);
const AdminGeocodeAddressDocument = graphql(/* GraphQL */ `
  query AdminGeocodeAddress($query: String!) {
    adminGeocodeAddress(query: $query) {
      latitude
      longitude
      sigunguCode
      regionId
    }
  }
`);
const AdminCreateRegionDocument = graphql(/* GraphQL */ `
  mutation AdminCreateRegion($input: AdminCreateRegionInput!) {
    adminCreateRegion(input: $input) {
      id
    }
  }
`);
const AdminUpdateRegionDocument = graphql(/* GraphQL */ `
  mutation AdminUpdateRegion($input: AdminUpdateRegionInput!) {
    adminUpdateRegion(input: $input) {
      id
    }
  }
`);
const AdminDeleteRegionDocument = graphql(/* GraphQL */ `
  mutation AdminDeleteRegion($regionId: ID!) {
    adminDeleteRegion(regionId: $regionId)
  }
`);

export function regionsQueryOptions(input: AdminRegionListInput) {
  return queryOptions({
    queryKey: regionsKeys.list(input),
    queryFn: async () => (await gqlRequest(AdminRegionsDocument, { input })).adminRegions,
  });
}

/** 숨긴 지역까지 전체(권역·시군구 약 90개). 선택기·이름 표시·자동 매칭이 같은 캐시를 쓴다 */
export function allRegionsQueryOptions() {
  return { ...regionsQueryOptions({ parentId: null, includeInactive: true }), staleTime: 60_000 };
}

/** 주소 → 좌표·시군구 코드·지역 ID(BE가 카카오 로컬로 찾는다). 못 찾으면 null */
export function geocodeAddress(qc: QueryClient, query: string) {
  return qc.fetchQuery({
    queryKey: regionsKeys.geocode(query),
    queryFn: async () =>
      (await gqlRequest(AdminGeocodeAddressDocument, { query })).adminGeocodeAddress,
    staleTime: Infinity,
  });
}

async function invalidate(qc: QueryClient) {
  await qc.invalidateQueries({ queryKey: regionsKeys.all });
}
export const regionMutations = {
  create: async (qc: QueryClient, input: AdminCreateRegionInput) => {
    const r = (await gqlRequest(AdminCreateRegionDocument, { input })).adminCreateRegion;
    await invalidate(qc);
    return r;
  },
  update: async (qc: QueryClient, input: AdminUpdateRegionInput) => {
    const r = (await gqlRequest(AdminUpdateRegionDocument, { input })).adminUpdateRegion;
    await invalidate(qc);
    return r;
  },
  remove: async (qc: QueryClient, regionId: string) => {
    const r = (await gqlRequest(AdminDeleteRegionDocument, { regionId })).adminDeleteRegion;
    await invalidate(qc);
    return r;
  },
};
