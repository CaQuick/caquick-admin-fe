import { type QueryClient, queryOptions } from '@tanstack/react-query';

import { graphql } from '@/graphql/generated';
import {
  type AdminCreateSellerInput,
  type AdminSellerListInput,
} from '@/graphql/generated/graphql';
import { gqlRequest } from '@/shared/api';

const sellersKeys = {
  all: ['sellers'] as const,
  lists: () => [...sellersKeys.all, 'list'] as const,
  list: (input: AdminSellerListInput) => [...sellersKeys.lists(), input] as const,
  detail: (accountId: string) => [...sellersKeys.all, 'detail', accountId] as const,
};

const AdminSellersDocument = graphql(/* GraphQL */ `
  query AdminSellers($input: AdminSellerListInput) {
    adminSellers(input: $input) {
      items {
        accountId
        username
        email
        name
        status
        mustChangePassword
        lastLoginAt
        profile {
          businessName
          businessPhone
          websiteUrl
        }
        store {
          id
          storeName
          storePhone
          addressFull
          isActive
        }
        createdAt
      }
      totalCount
      hasMore
      nextCursor
    }
  }
`);

const AdminSellerDocument = graphql(/* GraphQL */ `
  query AdminSeller($accountId: ID!) {
    adminSeller(accountId: $accountId) {
      accountId
      username
      email
      name
      status
      mustChangePassword
      lastLoginAt
      profile {
        businessName
        businessPhone
        websiteUrl
      }
      store {
        id
        storeName
        storePhone
        addressFull
        isActive
      }
      createdAt
    }
  }
`);

const AdminCreateSellerDocument = graphql(/* GraphQL */ `
  mutation AdminCreateSeller($input: AdminCreateSellerInput!) {
    adminCreateSeller(input: $input) {
      accountId
      username
    }
  }
`);

const AdminResetSellerPasswordDocument = graphql(/* GraphQL */ `
  mutation AdminResetSellerPassword($input: AdminResetSellerPasswordInput!) {
    adminResetSellerPassword(input: $input)
  }
`);

export function sellersListQueryOptions(input: AdminSellerListInput) {
  return queryOptions({
    queryKey: sellersKeys.list(input),
    queryFn: async () => (await gqlRequest(AdminSellersDocument, { input })).adminSellers,
    placeholderData: (prev) => prev,
  });
}

export function sellerDetailQueryOptions(accountId: string) {
  return queryOptions({
    queryKey: sellersKeys.detail(accountId),
    queryFn: async () => (await gqlRequest(AdminSellerDocument, { accountId })).adminSeller,
  });
}

export async function createSeller(queryClient: QueryClient, input: AdminCreateSellerInput) {
  const result = (await gqlRequest(AdminCreateSellerDocument, { input })).adminCreateSeller;
  await queryClient.invalidateQueries({ queryKey: sellersKeys.lists() });
  return result;
}

export async function resetSellerPassword(accountId: string, newPassword: string) {
  return (await gqlRequest(AdminResetSellerPasswordDocument, { input: { accountId, newPassword } }))
    .adminResetSellerPassword;
}

export async function invalidateSellers(queryClient: QueryClient, accountId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: sellersKeys.detail(accountId) }),
    queryClient.invalidateQueries({ queryKey: sellersKeys.lists() }),
  ]);
}
