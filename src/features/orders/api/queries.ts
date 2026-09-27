import { type QueryClient, queryOptions } from '@tanstack/react-query';

import { graphql } from '@/graphql/generated';
import { type AdminOrderListInput } from '@/graphql/generated/graphql';
import { gqlRequest } from '@/shared/api';

const ordersKeys = {
  all: ['orders'] as const,
  lists: () => [...ordersKeys.all, 'list'] as const,
  list: (input: AdminOrderListInput) => [...ordersKeys.lists(), input] as const,
  details: () => [...ordersKeys.all, 'detail'] as const,
  detail: (orderId: string) => [...ordersKeys.details(), orderId] as const,
};

const AdminOrdersDocument = graphql(/* GraphQL */ `
  query AdminOrders($input: AdminOrderListInput) {
    adminOrders(input: $input) {
      items {
        id
        orderNumber
        accountId
        storeId
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

export async function cancelOrder(queryClient: QueryClient, orderId: string, note: string) {
  const result = (await gqlRequest(AdminCancelOrderDocument, { input: { orderId, note } }))
    .adminCancelOrder;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ordersKeys.detail(orderId) }),
    queryClient.invalidateQueries({ queryKey: ordersKeys.lists() }),
  ]);
  return result;
}
