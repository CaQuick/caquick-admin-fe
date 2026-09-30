import { type QueryClient, queryOptions } from '@tanstack/react-query';

import { graphql } from '@/graphql/generated';
import { type AdminUserListInput } from '@/graphql/generated/graphql';
import { gqlRequest } from '@/shared/api';

const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (input: AdminUserListInput) => [...usersKeys.lists(), input] as const,
  detail: (accountId: string) => [...usersKeys.all, 'detail', accountId] as const,
};

const AdminUsersDocument = graphql(/* GraphQL */ `
  query AdminUsers($input: AdminUserListInput) {
    adminUsers(input: $input) {
      items {
        accountId
        email
        name
        status
        nickname
        phoneNumber
        onboardingCompleted
        identityProviders
        orderCount
        reviewCount
        createdAt
      }
      totalCount
      hasMore
      nextCursor
    }
  }
`);

const AdminUserDocument = graphql(/* GraphQL */ `
  query AdminUser($accountId: ID!) {
    adminUser(accountId: $accountId) {
      accountId
      email
      name
      status
      nickname
      phoneNumber
      onboardingCompleted
      identityProviders
      orderCount
      reviewCount
      createdAt
    }
  }
`);

const AdminSuspendAccountDocument = graphql(/* GraphQL */ `
  mutation AdminSuspendAccount($input: AdminSuspendAccountInput!) {
    adminSuspendAccount(input: $input) {
      accountId
      accountType
      status
    }
  }
`);

const AdminReinstateAccountDocument = graphql(/* GraphQL */ `
  mutation AdminReinstateAccount($accountId: ID!) {
    adminReinstateAccount(accountId: $accountId) {
      accountId
      accountType
      status
    }
  }
`);

export function usersListQueryOptions(input: AdminUserListInput) {
  return queryOptions({
    queryKey: usersKeys.list(input),
    queryFn: async () => (await gqlRequest(AdminUsersDocument, { input })).adminUsers,
    placeholderData: (prev) => prev,
  });
}

export function userDetailQueryOptions(accountId: string) {
  return queryOptions({
    queryKey: usersKeys.detail(accountId),
    queryFn: async () => (await gqlRequest(AdminUserDocument, { accountId })).adminUser,
  });
}

/** 정지·정지 해제는 USER·SELLER 공용. 호출자가 자기 feature의 키를 무효화한다(구매자는 users, 판매자는 sellers). */
export async function suspendAccount(accountId: string, reason: string) {
  return (await gqlRequest(AdminSuspendAccountDocument, { input: { accountId, reason } }))
    .adminSuspendAccount;
}

export async function reinstateAccount(accountId: string) {
  return (await gqlRequest(AdminReinstateAccountDocument, { accountId })).adminReinstateAccount;
}

export async function invalidateUsers(queryClient: QueryClient, accountId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: usersKeys.detail(accountId) }),
    queryClient.invalidateQueries({ queryKey: usersKeys.lists() }),
  ]);
}
