import { type QueryClient, queryOptions } from '@tanstack/react-query';

import { invalidateTasks } from '@/features/tasks';
import { graphql } from '@/graphql/generated';
import { type AdminCancelOrderInput, type AdminOrderListInput } from '@/graphql/generated/graphql';
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
  store: (storeId: string) => [...ordersKeys.all, 'store', storeId] as const,
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
        hasCustom
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
      requestNote
      payment {
        method
        status
        amount
        depositorName
        depositBank {
          code
          name
        }
        depositAccountNumber
        depositAccountHolder
        expiresAt
        buyerClaimedAt
        confirmedAt
        confirmSource
        confirmedByLabel
        confirmNote
      }
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
        customMode
        customPreviewImageUrl
        customBaseImageUrl
        customImages {
          id
          kind
          imageUrl
        }
        customTexts {
          id
          tokenKey
          label
          defaultText
          valueText
          posX
          posY
          width
          height
          textColor
          textAlign
          sortOrder
        }
        freeEdits {
          id
          posX
          posY
          width
          height
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
        actorType
        cancelReason
        cancelFault
        refundAmount
      }
      refunds {
        id
        kind
        amount
        status
        bank {
          code
          name
        }
        accountHolder
        accountNumberMasked
        requestedAt
        accountSubmittedAt
        completedAt
      }
      cancellation {
        actorType
        reason
        reasonLabel
        note
        fault
        refundAmount
        refundStatus
        refundCompletedAt
        canceledAt
      }
      cancelOptions {
        cancelable
        reasons
        refundRule
        paidAmount
      }
      confirmDeadlineAt
      autoPickupAt
      noShowAt
      pickupChanges {
        id
        fromPickupAt
        toPickupAt
        changedAt
        note
      }
      commissionRateBps
      expectedPayoutAmount
      settlementBaseAmount
      commissionAmount
      settlementFinalizedAt
      settlementId
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
        isActive
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

const AdminCompleteOrderPickupDocument = graphql(/* GraphQL */ `
  mutation AdminCompleteOrderPickup($input: AdminCompleteOrderPickupInput!) {
    adminCompleteOrderPickup(input: $input) {
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

/** 매장 이름·숨김 여부. 찾지 못하면 오류로 두고 부르는 쪽은 #ID를 보인다 */
export function storeRefQueryOptions(storeId: string) {
  return queryOptions({
    queryKey: ordersKeys.store(storeId),
    queryFn: async () =>
      (await gqlRequest(AdminOrdersStoreNameDocument, { storeId })).adminStore.store,
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

/** 주문 목록·상세를 다시 읽게 한다. 주문 상태·환불을 바꾸는 다른 화면(처리 대기)이 부른다 */
export async function invalidateOrders(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ordersKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: ordersKeys.details() }),
  ]);
}

/**
 * 처리했든 거절됐든(다른 곳에서 상태가 바뀐 경우 등) 상세·목록을 다시 불러 지금 상태와 선택지를 보인다.
 * 입금 대기 취소·환불 생성은 처리 대기 건수·목록도 바꾼다
 */
async function withRefresh<T>(queryClient: QueryClient, orderId: string, run: () => Promise<T>) {
  try {
    return await run();
  } finally {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ordersKeys.detail(orderId) }),
      queryClient.invalidateQueries({ queryKey: ordersKeys.lists() }),
      invalidateTasks(queryClient),
    ]);
  }
}

export function cancelOrder(queryClient: QueryClient, input: AdminCancelOrderInput) {
  return withRefresh(
    queryClient,
    String(input.orderId),
    async () => (await gqlRequest(AdminCancelOrderDocument, { input })).adminCancelOrder,
  );
}

export function completeOrderPickup(queryClient: QueryClient, orderId: string, note: string) {
  return withRefresh(
    queryClient,
    orderId,
    async () =>
      (
        await gqlRequest(AdminCompleteOrderPickupDocument, {
          input: { orderId, note: note || null },
        })
      ).adminCompleteOrderPickup,
  );
}
