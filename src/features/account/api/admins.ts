import { type QueryClient, queryOptions } from '@tanstack/react-query';

import { graphql } from '@/graphql/generated';
import { type AdminCreateAdminInput, type CursorInput } from '@/graphql/generated/graphql';
import { gqlRequest } from '@/shared/api';

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

export function adminsQueryOptions(input: CursorInput) {
  return queryOptions({
    queryKey: ['admins', input],
    queryFn: async () => (await gqlRequest(AdminAdminsDocument, { input })).adminAdmins,
    placeholderData: (p) => p,
  });
}

export async function createAdmin(qc: QueryClient, input: AdminCreateAdminInput) {
  const r = (await gqlRequest(AdminCreateAdminDocument, { input })).adminCreateAdmin;
  await qc.invalidateQueries({ queryKey: ['admins'] });
  return r;
}
