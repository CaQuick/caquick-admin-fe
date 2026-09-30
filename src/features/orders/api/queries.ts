import { type QueryClient, queryOptions } from '@tanstack/react-query';

import { graphql } from '@/graphql/generated';
import { type AdminOrderListInput } from '@/graphql/generated/graphql';
import { gqlRequest } from '@/shared/api';
import { type EntityOption } from '@/shared/ui/entity-picker';

const ordersKeys = {
  all: ['orders'] as const,
  lists: () => [...ordersKeys.all, 'list'] as const,
  list: (input: AdminOrderListInput) => [...ordersKeys.lists(), input] as const,
  details: () => [...ordersKeys.all, 'detail'] as const,
  detail: (orderId: string) => [...ordersKeys.details(), orderId] as const,
  // 필터 선택기·링크 이름. 매장·구매자 화면의 캐시와 섞이지 않게 주문 아래에 둔다
  storeOptions: (keyword: string) => [...ordersKeys.all, 'store-options', keyword] as const,
  buyerOptions: (keyword: string) => [...ordersKeys.all, 'buyer-options', keyword] as const,
  storeName: (storeId: string) => [...ordersKeys.all, 'store-name', storeId] as const,
  buyerName: (accountId: string) => [...ordersKeys.all, 'buyer-name', accountId] as const,
};

const AdminOrdersDocument = graphql(/* GraphQL */ `
  query AdminOrders($input: AdminOrderListInput) {
    adminOrders(input: $input) {
      items {
        id
        orderNumber
        accountId
        storeId
        storeName
        status
        pickupAt
        buyerName
        buyerPhone
        totalPrice
        createdAt
      }
      totalCount
      hasMore
      nextCursor
    }
  }
`);

const AdminOrderDocument = graphql(/* GraphQL */ `
  query AdminOrder($orderId: ID!) {
    adminOrder(orderId: $orderId) {
      id
      orderNumber
      buyer {
        accountId
        email
        nickname
        status
      }
      status
      pickupAt
      buyerName
      buyerPhone
      subtotalPrice
      discountPrice
      totalPrice
      submittedAt
      confirmedAt
      madeAt
      pickedUpAt
      canceledAt
      createdAt
      updatedAt
      items {
        id
        storeId
        productId
        productName
        regularPrice
        salePrice
        quantity
        itemSubtotalPrice
        optionItems {
          id
          groupName
          optionTitle
          priceDelta
        }
        customTexts {
          id
          tokenKey
          defaultText
          valueText
          sortOrder
        }
        freeEdits {
          id
          cropImageUrl
          descriptionText
          sortOrder
          attachments {
            id
            imageUrl
            sortOrder
          }
        }
      }
      statusHistories {
        id
        fromStatus
        toStatus
        changedAt
        note
      }
    }
  }
`);

const PICKER_LIMIT = 20;

const AdminOrdersStoreOptionsDocument = graphql(/* GraphQL */ `
  query AdminOrdersStoreOptions($input: AdminStoreListInput) {
    adminStores(input: $input) {
      items {
        id
        storeName
        isActive
      }
    }
  }
`);

const AdminOrdersBuyerOptionsDocument = graphql(/* GraphQL */ `
  query AdminOrdersBuyerOptions($input: AdminUserListInput) {
    adminUsers(input: $input) {
      items {
        accountId
        nickname
        name
        email
      }
    }
  }
`);

const AdminOrdersStoreNameDocument = graphql(/* GraphQL */ `
  query AdminOrdersStoreName($storeId: ID!) {
    adminStore(storeId: $storeId) {
      store {
        id
        storeName
      }
    }
  }
`);

const AdminOrdersBuyerNameDocument = graphql(/* GraphQL */ `
  query AdminOrdersBuyerName($accountId: ID!) {
    adminUser(accountId: $accountId) {
      accountId
      nickname
      name
      email
    }
  }
`);

const AdminCancelOrderDocument = graphql(/* GraphQL */ `
  mutation AdminCancelOrder($input: AdminCancelOrderInput!) {
    adminCancelOrder(input: $input) {
      id
      status
    }
  }
`);

export function ordersListQueryOptions(input: AdminOrderListInput) {
  return queryOptions({
    queryKey: ordersKeys.list(input),
    queryFn: async () => (await gqlRequest(AdminOrdersDocument, { input })).adminOrders,
    placeholderData: (prev) => prev,
  });
}

export function orderDetailQueryOptions(orderId: string) {
  return queryOptions({
    queryKey: ordersKeys.detail(orderId),
    queryFn: async () => (await gqlRequest(AdminOrderDocument, { orderId })).adminOrder,
  });
}

/** 구매자 표시 이름. 닉네임 → 이름 → 이메일 순, 모두 없으면 null(부르는 쪽이 #ID로 대신한다) */
function buyerDisplayName(buyer: {
  nickname?: string | null;
  name?: string | null;
  email?: string | null;
}): string | null {
  return buyer.nickname ?? buyer.name ?? buyer.email ?? null;
}

export function storeOptionsQueryOptions(keyword: string) {
  return queryOptions({
    queryKey: ordersKeys.storeOptions(keyword),
    queryFn: async () =>
      (
        await gqlRequest(AdminOrdersStoreOptionsDocument, {
          input: { keyword: keyword || null, limit: PICKER_LIMIT },
        })
      ).adminStores.items,
    select: (items): EntityOption[] =>
      items.map((s) => ({
        id: s.id,
        label: s.storeName,
        description: s.isActive ? undefined : '숨김',
      })),
  });
}

export function buyerOptionsQueryOptions(keyword: string) {
  return queryOptions({
    queryKey: ordersKeys.buyerOptions(keyword),
    queryFn: async () =>
      (
        await gqlRequest(AdminOrdersBuyerOptionsDocument, {
          input: { keyword: keyword || null, limit: PICKER_LIMIT },
        })
      ).adminUsers.items,
    select: (items): EntityOption[] =>
      items.map((u) => ({
        id: u.accountId,
        label: buyerDisplayName(u) ?? `#${u.accountId}`,
        description: u.email && u.email !== buyerDisplayName(u) ? u.email : undefined,
      })),
  });
}

/** 주소로 들어온 매장 ID의 이름. 찾지 못하면 오류로 두고 부르는 쪽은 #ID를 보인다 */
export function storeNameQueryOptions(storeId: string) {
  return queryOptions({
    queryKey: ordersKeys.storeName(storeId),
    queryFn: async () =>
      (await gqlRequest(AdminOrdersStoreNameDocument, { storeId })).adminStore.store.storeName,
    retry: false,
  });
}

export function buyerNameQueryOptions(accountId: string) {
  return queryOptions({
    queryKey: ordersKeys.buyerName(accountId),
    queryFn: async () =>
      buyerDisplayName((await gqlRequest(AdminOrdersBuyerNameDocument, { accountId })).adminUser),
    retry: false,
  });
}

export async function cancelOrder(queryClient: QueryClient, orderId: string, note: string) {
  const result = (await gqlRequest(AdminCancelOrderDocument, { input: { orderId, note } }))
    .adminCancelOrder;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ordersKeys.detail(orderId) }),
    queryClient.invalidateQueries({ queryKey: ordersKeys.lists() }),
  ]);
  return result;
}
