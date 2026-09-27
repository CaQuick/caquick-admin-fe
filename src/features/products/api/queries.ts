import { type QueryClient, queryOptions } from '@tanstack/react-query';

import { graphql } from '@/graphql/generated';
import { type AdminProductListInput } from '@/graphql/generated/graphql';
import { gqlRequest } from '@/shared/api';

const productsKeys = {
  all: ['products'] as const,
  lists: () => [...productsKeys.all, 'list'] as const,
  list: (input: AdminProductListInput) => [...productsKeys.lists(), input] as const,
  detail: (productId: string) => [...productsKeys.all, 'detail', productId] as const,
};

const AdminProductsDocument = graphql(/* GraphQL */ `
  query AdminProducts($input: AdminProductListInput) {
    adminProducts(input: $input) {
      items {
        id
        storeId
        storeName
        name
        regularPrice
        salePrice
        currency
        baseDesignImageUrl
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

const AdminProductDocument = graphql(/* GraphQL */ `
  query AdminProduct($productId: ID!) {
    adminProduct(productId: $productId) {
      product {
        id
        storeId
        storeName
        name
        regularPrice
        salePrice
        currency
        baseDesignImageUrl
        isActive
        createdAt
        updatedAt
      }
      storeIsActive
      description
      purchaseNotice
      preparationTimeMinutes
      imageUrls
      reviewCount
      orderItemCount
    }
  }
`);

const AdminSetProductActiveDocument = graphql(/* GraphQL */ `
  mutation AdminSetProductActive($input: AdminSetProductActiveInput!) {
    adminSetProductActive(input: $input) {
      id
      isActive
    }
  }
`);

export function productsListQueryOptions(input: AdminProductListInput) {
  return queryOptions({
    queryKey: productsKeys.list(input),
    queryFn: async () => (await gqlRequest(AdminProductsDocument, { input })).adminProducts,
    placeholderData: (prev) => prev,
  });
}

export function productDetailQueryOptions(productId: string) {
  return queryOptions({
    queryKey: productsKeys.detail(productId),
    queryFn: async () => (await gqlRequest(AdminProductDocument, { productId })).adminProduct,
  });
}

export async function setProductActive(
  queryClient: QueryClient,
  productId: string,
  isActive: boolean,
  reason: string | null,
) {
  const r = (
    await gqlRequest(AdminSetProductActiveDocument, { input: { productId, isActive, reason } })
  ).adminSetProductActive;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: productsKeys.detail(productId) }),
    queryClient.invalidateQueries({ queryKey: productsKeys.lists() }),
  ]);
  return r;
}
