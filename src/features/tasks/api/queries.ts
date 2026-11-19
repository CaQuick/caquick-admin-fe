import { type QueryClient, queryOptions } from '@tanstack/react-query';

import { invalidateDashboard } from '@/features/dashboard';
import { invalidateOrders } from '@/features/orders';
import { invalidateSettlements } from '@/features/settlements';
import { graphql } from '@/graphql/generated';
import {
  type AdminConfirmPaymentInput,
  type AdminCreateDepositReturnInput,
  type AdminDepositRecordListInput,
  type AdminTasksDepositRecordsQuery,
  type AdminPendingPaymentListInput,
  type AdminRecordUnidentifiedDepositInput,
  type AdminRefundListInput,
  type AdminSettlementListInput,
  type AdminTasksOrderQuery,
  type AdminTasksPendingPaymentsQuery,
  type AdminTasksRefundQuery,
  type AdminTasksRefundsQuery,
  type AdminTasksSettlementQuery,
  type AdminTasksSettlementsQuery,
} from '@/graphql/generated/graphql';
import { gqlRequest } from '@/shared/api';
import { formatKrw } from '@/shared/lib/format';
import { MAX_KEYWORD_LENGTH } from '@/shared/lib/list-search';
import { type EntityOption } from '@/shared/ui/entity-picker';

/** 건수·목록 폴링 주기. 디스코드 알림은 다시 올 수 있어 건수와 목록을 진실로 둔다 */
const TASK_POLL_MS = 60_000;

const tasksKeys = {
  all: ['tasks'] as const,
  counts: () => [...tasksKeys.all, 'counts'] as const,
  pendingPayments: (input: AdminPendingPaymentListInput) =>
    [...tasksKeys.all, 'pending-payments', input] as const,
  order: (orderId: string) => [...tasksKeys.all, 'order', orderId] as const,
  depositRecords: (input: AdminDepositRecordListInput) =>
    [...tasksKeys.all, 'deposit-records', input] as const,
  refunds: (input: AdminRefundListInput) => [...tasksKeys.all, 'refunds', input] as const,
  refund: (refundId: string) => [...tasksKeys.all, 'refund', refundId] as const,
  settlements: (input: AdminSettlementListInput) =>
    [...tasksKeys.all, 'settlements', input] as const,
  settlement: (settlementId: string) => [...tasksKeys.all, 'settlement', settlementId] as const,
  orderOptions: (keyword: string) => [...tasksKeys.all, 'order-options', keyword] as const,
};

const AdminTaskCountsDocument = graphql(/* GraphQL */ `
  query AdminTaskCounts {
    adminTaskCounts {
      claimedPayments
      pendingPayments
      refundsAwaitingAccount
      refundsAwaitingTransfer
      pendingSettlements
    }
  }
`);

const AdminTasksPendingPaymentsDocument = graphql(/* GraphQL */ `
  query AdminTasksPendingPayments($input: AdminPendingPaymentListInput) {
    adminPendingPayments(input: $input) {
      items {
        orderId
        orderNumber
        storeName
        productName
        amount
        depositorName
        buyerName
        buyerPhone
        createdAt
        expiresAt
        buyerClaimedAt
        pickupAt
      }
      totalCount
      hasMore
      nextCursor
    }
  }
`);
export type PendingPayment =
  AdminTasksPendingPaymentsQuery['adminPendingPayments']['items'][number];

const AdminTasksOrderDocument = graphql(/* GraphQL */ `
  query AdminTasksOrder($orderId: ID!) {
    adminOrder(orderId: $orderId) {
      id
      orderNumber
      status
      pickupAt
      buyerName
      buyerPhone
      totalPrice
      createdAt
      items {
        id
        productName
      }
      payment {
        status
        amount
        depositorName
        expiresAt
        buyerClaimedAt
        confirmedAt
        confirmedByLabel
        confirmNote
      }
      cancellation {
        actorType
        reasonLabel
        note
        canceledAt
      }
    }
  }
`);
export type TaskOrder = AdminTasksOrderQuery['adminOrder'];

const AdminTasksConfirmPaymentDocument = graphql(/* GraphQL */ `
  mutation AdminTasksConfirmPayment($input: AdminConfirmPaymentInput!) {
    adminConfirmPayment(input: $input) {
      id
      status
    }
  }
`);

const AdminTasksCancelUnpaidDocument = graphql(/* GraphQL */ `
  mutation AdminTasksCancelUnpaid($input: AdminCancelOrderInput!) {
    adminCancelOrder(input: $input) {
      id
      status
    }
  }
`);

const AdminTasksDepositRecordsDocument = graphql(/* GraphQL */ `
  query AdminTasksDepositRecords($input: AdminDepositRecordListInput) {
    adminDepositRecords(input: $input) {
      items {
        id
        kind
        orderId
        orderNumber
        amount
        depositorName
        depositedAt
        note
        recordedByLabel
        refundId
        refundStatus
        createdAt
      }
      totalCount
      hasMore
      nextCursor
    }
  }
`);
export type DepositRecord = AdminTasksDepositRecordsQuery['adminDepositRecords']['items'][number];

const AdminTasksCreateDepositReturnDocument = graphql(/* GraphQL */ `
  mutation AdminTasksCreateDepositReturn($input: AdminCreateDepositReturnInput!) {
    adminCreateDepositReturn(input: $input) {
      id
      refundId
    }
  }
`);

const AdminTasksRecordUnidentifiedDepositDocument = graphql(/* GraphQL */ `
  mutation AdminTasksRecordUnidentifiedDeposit($input: AdminRecordUnidentifiedDepositInput!) {
    adminRecordUnidentifiedDeposit(input: $input) {
      id
    }
  }
`);

const AdminTasksLinkUnidentifiedDepositDocument = graphql(/* GraphQL */ `
  mutation AdminTasksLinkUnidentifiedDeposit($input: AdminLinkUnidentifiedDepositInput!) {
    adminLinkUnidentifiedDeposit(input: $input) {
      id
    }
  }
`);

const AdminTasksOrderOptionsDocument = graphql(/* GraphQL */ `
  query AdminTasksOrderOptions($input: AdminOrderListInput) {
    adminOrders(input: $input) {
      items {
        id
        orderNumber
        buyerName
        totalPrice
      }
    }
  }
`);

const AdminTasksRefundsDocument = graphql(/* GraphQL */ `
  query AdminTasksRefunds($input: AdminRefundListInput) {
    adminRefunds(input: $input) {
      items {
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
        orderId
        orderNumber
        buyerName
        buyerPhone
        storeName
        productName
      }
      totalCount
      hasMore
      nextCursor
    }
  }
`);
export type RefundRow = AdminTasksRefundsQuery['adminRefunds']['items'][number];

const AdminTasksRefundDocument = graphql(/* GraphQL */ `
  query AdminTasksRefund($refundId: ID!) {
    adminRefund(refundId: $refundId) {
      refund {
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
        orderId
        orderNumber
        buyerName
        buyerPhone
        storeName
        productName
        completedByLabel
        completeNote
      }
      accountNumber
      depositRecord {
        id
        depositorName
        depositedAt
        note
      }
    }
  }
`);
export type RefundDetail = AdminTasksRefundQuery['adminRefund'];

const AdminTasksCompleteRefundDocument = graphql(/* GraphQL */ `
  mutation AdminTasksCompleteRefund($input: AdminCompleteRefundInput!) {
    adminCompleteRefund(input: $input) {
      id
      status
    }
  }
`);

const AdminTasksSettlementsDocument = graphql(/* GraphQL */ `
  query AdminTasksSettlements($input: AdminSettlementListInput) {
    adminSettlements(input: $input) {
      items {
        id
        storeId
        storeName
        periodStart
        periodEnd
        orderCount
        settlementBaseAmount
        commissionAmount
        payoutAmount
        status
        accountRegistered
        createdAt
      }
      totalCount
      hasMore
      nextCursor
    }
  }
`);
export type SettlementRow = AdminTasksSettlementsQuery['adminSettlements']['items'][number];

const AdminTasksSettlementDocument = graphql(/* GraphQL */ `
  query AdminTasksSettlement($settlementId: ID!) {
    adminSettlement(settlementId: $settlementId) {
      id
      storeId
      storeName
      periodStart
      periodEnd
      orderCount
      settlementBaseAmount
      commissionAmount
      payoutAmount
      status
      paidAt
      accountRegistered
      paidByLabel
      paidNote
      paidAccount {
        bank {
          code
          name
        }
        accountHolder
        accountNumberMasked
      }
      currentAccount {
        bank {
          code
          name
        }
        accountHolder
        accountNumber
      }
    }
  }
`);
export type SettlementDetail = AdminTasksSettlementQuery['adminSettlement'];

const listOptions = {
  refetchInterval: TASK_POLL_MS,
  refetchOnWindowFocus: true,
} as const;

/** 사이드바·탭·대시보드가 같이 쓰는 처리 대기 건수 */
export function taskCountsQueryOptions() {
  return queryOptions({
    queryKey: tasksKeys.counts(),
    queryFn: async () => (await gqlRequest(AdminTaskCountsDocument)).adminTaskCounts,
    refetchInterval: TASK_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function pendingPaymentsQueryOptions(input: AdminPendingPaymentListInput) {
  return queryOptions({
    queryKey: tasksKeys.pendingPayments(input),
    queryFn: async () =>
      (await gqlRequest(AdminTasksPendingPaymentsDocument, { input })).adminPendingPayments,
    ...listOptions,
  });
}

export function taskOrderQueryOptions(orderId: string) {
  return queryOptions({
    queryKey: tasksKeys.order(orderId),
    queryFn: async () => (await gqlRequest(AdminTasksOrderDocument, { orderId })).adminOrder,
    retry: false,
  });
}

export function depositRecordsQueryOptions(input: AdminDepositRecordListInput) {
  return queryOptions({
    queryKey: tasksKeys.depositRecords(input),
    queryFn: async () =>
      (await gqlRequest(AdminTasksDepositRecordsDocument, { input })).adminDepositRecords,
    ...listOptions,
  });
}

export function refundsQueryOptions(input: AdminRefundListInput) {
  return queryOptions({
    queryKey: tasksKeys.refunds(input),
    queryFn: async () => (await gqlRequest(AdminTasksRefundsDocument, { input })).adminRefunds,
    ...listOptions,
  });
}

export function refundQueryOptions(refundId: string) {
  return queryOptions({
    queryKey: tasksKeys.refund(refundId),
    queryFn: async () => (await gqlRequest(AdminTasksRefundDocument, { refundId })).adminRefund,
    retry: false,
  });
}

export function settlementsQueryOptions(input: AdminSettlementListInput) {
  return queryOptions({
    queryKey: tasksKeys.settlements(input),
    queryFn: async () =>
      (await gqlRequest(AdminTasksSettlementsDocument, { input })).adminSettlements,
    ...listOptions,
  });
}

export function settlementQueryOptions(settlementId: string) {
  return queryOptions({
    queryKey: tasksKeys.settlement(settlementId),
    queryFn: async () =>
      (await gqlRequest(AdminTasksSettlementDocument, { settlementId })).adminSettlement,
    retry: false,
  });
}

/** 종결 기록을 연결할 주문 검색(주문번호·주문자 이름·연락처) */
export function orderOptionsQueryOptions(keyword: string) {
  return queryOptions({
    queryKey: tasksKeys.orderOptions(keyword),
    queryFn: async () =>
      (
        await gqlRequest(AdminTasksOrderOptionsDocument, {
          input: {
            keyword: keyword === '' ? null : [...keyword].slice(0, MAX_KEYWORD_LENGTH).join(''),
            limit: 20,
          },
        })
      ).adminOrders.items,
    select: (items): EntityOption[] =>
      items.map((o) => ({
        id: o.id,
        label: o.orderNumber,
        description: `${o.buyerName} · ${formatKrw(o.totalPrice)}`,
      })),
  });
}

/** 건수·목록·단건을 다시 읽게 한다. 처리 대기 건을 바꾸는 다른 화면(강제 취소·정산 송금 완료 등)도 부른다 */
export const invalidateTasks = (qc: QueryClient) =>
  qc.invalidateQueries({ queryKey: tasksKeys.all });

/**
 * 처리 뒤·충돌 뒤 다시 읽는다. 처리자·시각은 다시 읽은 단건이 보인다.
 * 처리는 주문 상태·환불을 바꾸므로 주문·정산·대시보드도 다시 읽게 한다. 정산 송금 완료는 정산 feature가 맡는다
 */
async function run<T>(qc: QueryClient, request: Promise<T>): Promise<T> {
  try {
    return await request;
  } finally {
    await Promise.all([
      invalidateTasks(qc),
      invalidateOrders(qc),
      invalidateSettlements(qc),
      invalidateDashboard(qc),
    ]);
  }
}

export const taskMutations = {
  confirmPayment: (qc: QueryClient, input: AdminConfirmPaymentInput) =>
    run(qc, gqlRequest(AdminTasksConfirmPaymentDocument, { input })),
  cancelUnpaid: (qc: QueryClient, orderId: string, note: string) =>
    run(
      qc,
      gqlRequest(AdminTasksCancelUnpaidDocument, {
        input: { orderId, reason: 'PAYMENT_NOT_RECEIVED', note: note || null },
      }),
    ),
  createDepositReturn: async (qc: QueryClient, input: AdminCreateDepositReturnInput) =>
    (await run(qc, gqlRequest(AdminTasksCreateDepositReturnDocument, { input })))
      .adminCreateDepositReturn,
  recordUnidentifiedDeposit: (qc: QueryClient, input: AdminRecordUnidentifiedDepositInput) =>
    run(qc, gqlRequest(AdminTasksRecordUnidentifiedDepositDocument, { input })),
  linkUnidentifiedDeposit: (qc: QueryClient, depositRecordId: string, orderId: string) =>
    run(
      qc,
      gqlRequest(AdminTasksLinkUnidentifiedDepositDocument, {
        input: { depositRecordId, orderId },
      }),
    ),
  completeRefund: (qc: QueryClient, refundId: string, note: string) =>
    run(
      qc,
      gqlRequest(AdminTasksCompleteRefundDocument, { input: { refundId, note: note || null } }),
    ),
};
