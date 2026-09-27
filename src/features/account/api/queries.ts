import { queryOptions } from '@tanstack/react-query';

import { graphql } from '@/graphql/generated';
import { gqlRequest } from '@/shared/api';

export const accountKeys = {
  all: ['account'] as const,
  me: () => [...accountKeys.all, 'me'] as const,
};

export const AdminMeDocument = graphql(/* GraphQL */ `
  query AdminMe {
    adminMe {
      accountId
      username
      email
      name
      status
      mustChangePassword
      lastLoginAt
      createdAt
    }
  }
`);

export function adminMeQueryOptions() {
  return queryOptions({
    queryKey: accountKeys.me(),
    queryFn: async () => (await gqlRequest(AdminMeDocument)).adminMe,
    staleTime: 60_000,
  });
}
