import { queryOptions } from '@tanstack/react-query';

import { graphql } from '@/graphql/generated';
import { type AdminAuditLogListInput } from '@/graphql/generated/graphql';
import { gqlRequest } from '@/shared/api';

const AdminAuditLogsDocument = graphql(/* GraphQL */ `
  query AdminAuditLogs($input: AdminAuditLogListInput) {
    adminAuditLogs(input: $input) {
      items {
        id
        actorAccountId
        actorAccountType
        storeId
        targetType
        targetId
        action
        beforeJson
        afterJson
        ipAddress
        userAgent
        createdAt
      }
      totalCount
      hasMore
      nextCursor
    }
  }
`);

export function auditLogsQueryOptions(input: AdminAuditLogListInput) {
  return queryOptions({
    queryKey: ['audit-logs', input],
    queryFn: async () => (await gqlRequest(AdminAuditLogsDocument, { input })).adminAuditLogs,
    placeholderData: (p) => p,
  });
}
