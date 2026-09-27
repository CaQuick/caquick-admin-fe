import { type QueryClient, queryOptions } from '@tanstack/react-query';

import { graphql } from '@/graphql/generated';
import {
  type AdminCreateRegionInput,
  type AdminRegionListInput,
  type AdminUpdateRegionInput,
} from '@/graphql/generated/graphql';
import { gqlRequest } from '@/shared/api';

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
    queryKey: ['regions', input],
    queryFn: async () => (await gqlRequest(AdminRegionsDocument, { input })).adminRegions,
  });
}

async function invalidate(qc: QueryClient) {
  await qc.invalidateQueries({ queryKey: ['regions'] });
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
