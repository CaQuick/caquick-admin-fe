import { type QueryClient, queryOptions } from '@tanstack/react-query';

import { graphql } from '@/graphql/generated';
import { type AdminProductListInput } from '@/graphql/generated/graphql';
import { gqlRequest } from '@/shared/api';
import { MAX_KEYWORD_LENGTH } from '@/shared/lib/list-search';
import { type EntityOption } from '@/shared/ui/entity-picker';

const STORE_OPTIONS_LIMIT = 20;

const productsKeys = {
  all: ['products'] as const,
  lists: () => [...productsKeys.all, 'list'] as const,
  list: (input: AdminProductListInput) => [...productsKeys.lists(), input] as const,
  detail: (productId: string) => [...productsKeys.all, 'detail', productId] as const,
  storeOptions: (keyword: string) => [...productsKeys.all, 'store-options', keyword] as const,
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
      categories {
        id
        categoryType
        name
        isActive
      }
      tags {
        id
        name
      }
      optionGroups {
        id
        name
        description
        isRequired
        minSelect
        maxSelect
        optionRequiresDescription
        optionRequiresImage
        sortOrder
        isActive
        optionItems {
          id
          title
          description
          imageUrl
          priceDelta
          sortOrder
          isActive
        }
      }
      customTemplate {
        id
        baseImageUrl
        isActive
        textTokens {
          id
          tokenKey
          defaultText
          maxLength
          sortOrder
          isRequired
        }
      }
    }
  }
`);

const AdminProductStoreOptionsDocument = graphql(/* GraphQL */ `
  query AdminProductStoreOptions($input: AdminStoreListInput) {
    adminStores(input: $input) {
      items {
        id
        storeName
        isActive
      }
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

/** 상품 목록의 매장 필터 선택기. 이름 부분일치로 매장을 찾는다 */
export function storeOptionsQueryOptions(keyword: string) {
  return queryOptions({
    queryKey: productsKeys.storeOptions(keyword),
    queryFn: async () =>
      (
        await gqlRequest(AdminProductStoreOptionsDocument, {
          input: {
            // BE 검색어 상한을 넘기면 요청 자체가 거절된다 — 목록 필터와 같은 기준으로 자른다
            keyword: [...keyword].slice(0, MAX_KEYWORD_LENGTH).join('') || null,
            limit: STORE_OPTIONS_LIMIT,
          },
        })
      ).adminStores.items,
    select: (items): EntityOption[] =>
      items.map((s) => ({
        id: s.id,
        label: s.storeName,
        description: s.isActive ? `ID ${s.id}` : `ID ${s.id} · 숨김`,
      })),
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
