import { type QueryClient, queryOptions } from '@tanstack/react-query';

import { graphql } from '@/graphql/generated';
import { type AdminCreateAdminInput, type CursorInput } from '@/graphql/generated/graphql';
import { gqlRequest } from '@/shared/api';

const adminsKeys = {
  all: ['admins'] as const,
  list: (input: CursorInput) => [...adminsKeys.all, input] as const,
};

const AdminAdminsDocument = graphql(/* GraphQL */ `
  query AdminAdmins($input: CursorInput) {
    adminAdmins(input: $input) {
      items {
        accountId
        username
        email
        name
        status
        mustChangePassword
        lastLoginAt
        createdAt
      }
      totalCount
      hasMore
      nextCursor
    }
  }
`);
const AdminCreateAdminDocument = graphql(/* GraphQL */ `
  mutation AdminCreateAdmin($input: AdminCreateAdminInput!) {
    adminCreateAdmin(input: $input) {
      accountId
      username
    }
  }
`);
const AdminResetAdminPasswordDocument = graphql(/* GraphQL */ `
  mutation AdminResetAdminPassword($input: AdminResetAdminPasswordInput!) {
    adminResetAdminPassword(input: $input)
  }
`);

export function adminsQueryOptions(input: CursorInput) {
  return queryOptions({
    queryKey: adminsKeys.list(input),
    queryFn: async () => (await gqlRequest(AdminAdminsDocument, { input })).adminAdmins,
    placeholderData: (p) => p,
  });
}

export async function createAdmin(qc: QueryClient, input: AdminCreateAdminInput) {
  const r = (await gqlRequest(AdminCreateAdminDocument, { input })).adminCreateAdmin;
  await qc.invalidateQueries({ queryKey: adminsKeys.all });
  return r;
}

/** 다른 관리자만 된다. 본인이면 BE가 CANNOT_RESET_OWN_PASSWORD(403)를 준다 */
export async function resetAdminPassword(qc: QueryClient, accountId: string, newPassword: string) {
  const r = (
    await gqlRequest(AdminResetAdminPasswordDocument, { input: { accountId, newPassword } })
  ).adminResetAdminPassword;
  // '비밀번호 변경 필요' 표시가 바로 보이게 목록을 다시 받는다
  await qc.invalidateQueries({ queryKey: adminsKeys.all });
  return r;
}
