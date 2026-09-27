import { type QueryClient, queryOptions } from '@tanstack/react-query';

import { graphql } from '@/graphql/generated';
import {
  type AdminStoreListInput,
  type AdminUpdateStoreBasicInfoInput,
} from '@/graphql/generated/graphql';
import { gqlRequest } from '@/shared/api';

const storesKeys = {
  all: ['stores'] as const,
  lists: () => [...storesKeys.all, 'list'] as const,
  list: (input: AdminStoreListInput) => [...storesKeys.lists(), input] as const,
  detail: (storeId: string) => [...storesKeys.all, 'detail', storeId] as const,
};

const AdminStoresDocument = graphql(/* GraphQL */ `
  query AdminStores($input: AdminStoreListInput) {
    adminStores(input: $input) {
      items {
        id
        sellerAccountId
        storeName
        storePhone
        addressFull
        regionId
        isActive
        createdAt
        updatedAt
      }
      totalCount
      hasMore
      nextCursor
    }
  }
`);

const AdminStoreDocument = graphql(/* GraphQL */ `
  query AdminStore($storeId: ID!) {
    adminStore(storeId: $storeId) {
      store {
        id
        sellerAccountId
        storeName
        storePhone
        addressFull
        addressCity
        addressDistrict
        addressNeighborhood
        regionId
        latitude
        longitude
        mapProvider
        websiteUrl
        businessHoursText
        profileImageUrl
        greetingMessage
        pickupSlotIntervalMinutes
        minLeadTimeMinutes
        maxDaysAhead
        isActive
        createdAt
        updatedAt
      }
      seller {
        accountId
        username
        email
        name
        status
      }
      productCount
      orderItemCount
    }
  }
`);

const AdminSetStoreActiveDocument = graphql(/* GraphQL */ `
  mutation AdminSetStoreActive($input: AdminSetStoreActiveInput!) {
    adminSetStoreActive(input: $input) {
      id
      isActive
    }
  }
`);

const AdminUpdateStoreBasicInfoDocument = graphql(/* GraphQL */ `
  mutation AdminUpdateStoreBasicInfo($input: AdminUpdateStoreBasicInfoInput!) {
    adminUpdateStoreBasicInfo(input: $input) {
      id
      updatedAt
    }
  }
`);

export function storesListQueryOptions(input: AdminStoreListInput) {
  return queryOptions({
    queryKey: storesKeys.list(input),
    queryFn: async () => (await gqlRequest(AdminStoresDocument, { input })).adminStores,
    placeholderData: (prev) => prev,
  });
}

export function storeDetailQueryOptions(storeId: string) {
  return queryOptions({
    queryKey: storesKeys.detail(storeId),
    queryFn: async () => (await gqlRequest(AdminStoreDocument, { storeId })).adminStore,
  });
}

async function invalidate(queryClient: QueryClient, storeId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: storesKeys.detail(storeId) }),
    queryClient.invalidateQueries({ queryKey: storesKeys.lists() }),
  ]);
}

export async function setStoreActive(
  queryClient: QueryClient,
  storeId: string,
  isActive: boolean,
  reason: string | null,
) {
  const r = (
    await gqlRequest(AdminSetStoreActiveDocument, { input: { storeId, isActive, reason } })
  ).adminSetStoreActive;
  await invalidate(queryClient, storeId);
  return r;
}

export async function updateStoreBasicInfo(
  queryClient: QueryClient,
  input: AdminUpdateStoreBasicInfoInput,
) {
  const r = (await gqlRequest(AdminUpdateStoreBasicInfoDocument, { input }))
    .adminUpdateStoreBasicInfo;
  await invalidate(queryClient, String(input.storeId));
  return r;
}
