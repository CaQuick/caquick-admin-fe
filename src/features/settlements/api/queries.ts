import { type QueryClient, queryOptions } from '@tanstack/react-query';

import { invalidateTasks } from '@/features/tasks';
import { graphql } from '@/graphql/generated';
import {
  type AdminSettlementListInput,
  type AdminUpdatePaymentSettingInput,
  type AdminUpsertStoreSettlementAccountInput,
} from '@/graphql/generated/graphql';
import { gqlRequest } from '@/shared/api';
import { type EntityOption } from '@/shared/ui/entity-picker';

const settlementsKeys = {
  all: ['settlements'] as const,
  lists: () => [...settlementsKeys.all, 'list'] as const,
  list: (input: AdminSettlementListInput) => [...settlementsKeys.lists(), input] as const,
  details: () => [...settlementsKeys.all, 'detail'] as const,
  detail: (id: string) => [...settlementsKeys.details(), id] as const,
  monthly: (month: string) => [...settlementsKeys.all, 'monthly', month] as const,
  storeAccount: (storeId: string) => [...settlementsKeys.all, 'store-account', storeId] as const,
  storePicker: (keyword: string) => [...settlementsKeys.all, 'store-picker', keyword] as const,
  paymentSetting: () => [...settlementsKeys.all, 'payment-setting'] as const,
  banks: () => [...settlementsKeys.all, 'banks'] as const,
};

const AdminSettlementsDocument = graphql(/* GraphQL */ `
  query AdminSettlements($input: AdminSettlementListInput) {
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
        paidAt
        accountRegistered
        createdAt
      }
      totalCount
      hasMore
      nextCursor
    }
  }
`);

const AdminSettlementDocument = graphql(/* GraphQL */ `
  query AdminSettlement($settlementId: ID!) {
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
      createdAt
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
        storeId
        bank {
          code
          name
        }
        accountHolder
        accountNumber
        accountNumberMasked
        updatedByRole
        updatedAt
      }
      orders {
        orderId
        orderNumber
        productName
        status
        commissionRateBps
        settlementBaseAmount
        commissionAmount
        payoutAmount
        settlementFinalizedAt
      }
    }
  }
`);

const AdminMarkSettlementPaidDocument = graphql(/* GraphQL */ `
  mutation AdminMarkSettlementPaid($input: AdminMarkSettlementPaidInput!) {
    adminMarkSettlementPaid(input: $input) {
      id
      status
    }
  }
`);

const AdminMonthlyCommissionsDocument = graphql(/* GraphQL */ `
  query AdminMonthlyCommissions($input: AdminMonthlyCommissionInput!) {
    adminMonthlyCommissions(input: $input) {
      month
      orderCount
      settlementBaseAmount
      commissionAmount
      stores {
        storeId
        storeName
        orderCount
        settlementBaseAmount
        commissionAmount
      }
    }
  }
`);

const AdminStoreSettlementAccountDocument = graphql(/* GraphQL */ `
  query AdminStoreSettlementAccount($storeId: ID!) {
    adminStoreSettlementAccount(storeId: $storeId) {
      storeId
      bank {
        code
        name
      }
      accountHolder
      accountNumber
      accountNumberMasked
      updatedByRole
      updatedAt
    }
  }
`);

const AdminUpsertStoreSettlementAccountDocument = graphql(/* GraphQL */ `
  mutation AdminUpsertStoreSettlementAccount($input: AdminUpsertStoreSettlementAccountInput!) {
    adminUpsertStoreSettlementAccount(input: $input) {
      storeId
    }
  }
`);

const AdminSettlementStorePickerDocument = graphql(/* GraphQL */ `
  query AdminSettlementStorePicker($input: AdminStoreListInput) {
    adminStores(input: $input) {
      items {
        id
        storeName
        isActive
      }
    }
  }
`);

const AdminPaymentSettingDocument = graphql(/* GraphQL */ `
  query AdminPaymentSetting {
    adminPaymentSetting {
      commissionRateBps
      depositBank {
        code
        name
      }
      depositAccountNumber
      depositAccountHolder
      updatedAt
    }
  }
`);

const AdminUpdatePaymentSettingDocument = graphql(/* GraphQL */ `
  mutation AdminUpdatePaymentSetting($input: AdminUpdatePaymentSettingInput!) {
    adminUpdatePaymentSetting(input: $input) {
      updatedAt
    }
  }
`);

const AdminPaymentBanksDocument = graphql(/* GraphQL */ `
  query AdminPaymentBanks {
    paymentBanks {
      code
      name
    }
  }
`);

export function settlementsListQueryOptions(input: AdminSettlementListInput) {
  return queryOptions({
    queryKey: settlementsKeys.list(input),
    queryFn: async () => (await gqlRequest(AdminSettlementsDocument, { input })).adminSettlements,
    placeholderData: (prev) => prev,
  });
}

export function settlementDetailQueryOptions(settlementId: string) {
  return queryOptions({
    queryKey: settlementsKeys.detail(settlementId),
    queryFn: async () =>
      (await gqlRequest(AdminSettlementDocument, { settlementId })).adminSettlement,
  });
}

export function monthlyCommissionsQueryOptions(month: string) {
  return queryOptions({
    queryKey: settlementsKeys.monthly(month),
    queryFn: async () =>
      (await gqlRequest(AdminMonthlyCommissionsDocument, { input: { month } }))
        .adminMonthlyCommissions,
  });
}

export function storeSettlementAccountQueryOptions(storeId: string) {
  return queryOptions({
    queryKey: settlementsKeys.storeAccount(storeId),
    queryFn: async () =>
      (await gqlRequest(AdminStoreSettlementAccountDocument, { storeId }))
        .adminStoreSettlementAccount,
  });
}

export function paymentSettingQueryOptions() {
  return queryOptions({
    queryKey: settlementsKeys.paymentSetting(),
    queryFn: async () => (await gqlRequest(AdminPaymentSettingDocument)).adminPaymentSetting,
  });
}

/** 은행 목록은 배포 사이에 바뀌지 않는다 */
export function banksQueryOptions() {
  return queryOptions({
    queryKey: settlementsKeys.banks(),
    queryFn: async () => (await gqlRequest(AdminPaymentBanksDocument)).paymentBanks,
    staleTime: Infinity,
  });
}

export function storePickerQuery(keyword: string) {
  return queryOptions({
    queryKey: settlementsKeys.storePicker(keyword),
    queryFn: async () =>
      (
        await gqlRequest(AdminSettlementStorePickerDocument, {
          input: { keyword: keyword || null, limit: 20 },
        })
      ).adminStores.items,
    select: (items): EntityOption[] =>
      items.map((s) => ({
        id: s.id,
        label: s.storeName,
        description: s.isActive ? `#${s.id}` : `#${s.id} · 숨김`,
      })),
  });
}

/** 정산 목록·상세를 다시 읽게 한다. 처리 대기 화면도 처리 뒤 부른다 */
export async function invalidateSettlements(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: settlementsKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: settlementsKeys.details() }),
  ]);
}

/** 처리했든 409로 거절됐든 다시 읽어 처리자·시각을 보인다. 처리 대기 건수·목록도 함께 줄어든다 */
export async function markSettlementPaid(
  queryClient: QueryClient,
  settlementId: string,
  note: string | null,
) {
  try {
    return (await gqlRequest(AdminMarkSettlementPaidDocument, { input: { settlementId, note } }))
      .adminMarkSettlementPaid;
  } finally {
    await Promise.all([invalidateSettlements(queryClient), invalidateTasks(queryClient)]);
  }
}

export async function upsertStoreSettlementAccount(
  queryClient: QueryClient,
  input: AdminUpsertStoreSettlementAccountInput,
) {
  const r = (await gqlRequest(AdminUpsertStoreSettlementAccountDocument, { input }))
    .adminUpsertStoreSettlementAccount;
  // 정산 목록·상세(처리 대기 정산 송금 포함)의 계좌 등록 여부와 현재 계좌도 바뀐다
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: settlementsKeys.storeAccount(String(input.storeId)),
    }),
    invalidateSettlements(queryClient),
    invalidateTasks(queryClient),
  ]);
  return r;
}

export async function updatePaymentSetting(
  queryClient: QueryClient,
  input: AdminUpdatePaymentSettingInput,
) {
  const r = (await gqlRequest(AdminUpdatePaymentSettingDocument, { input }))
    .adminUpdatePaymentSetting;
  await queryClient.invalidateQueries({ queryKey: settlementsKeys.paymentSetting() });
  return r;
}
