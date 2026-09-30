import { queryOptions } from '@tanstack/react-query';

import { graphql } from '@/graphql/generated';
import { type AdminAuditLogListInput } from '@/graphql/generated/graphql';
import { gqlRequest } from '@/shared/api';
import { type EntityOption } from '@/shared/ui/entity-picker';

import { accountLabel } from '../meta';

const keys = {
  list: (input: AdminAuditLogListInput) => ['audit-logs', input] as const,
  storePicker: (keyword: string) => ['audit-log-pickers', 'store', keyword] as const,
  actorPicker: (keyword: string) => ['audit-log-pickers', 'actor', keyword] as const,
};

const AdminAuditLogsDocument = graphql(/* GraphQL */ `
  query AdminAuditLogs($input: AdminAuditLogListInput) {
    adminAuditLogs(input: $input) {
      items {
        id
        actorAccountId
        actorAccountType
        actorLabel
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
const AdminAuditStorePickerDocument = graphql(/* GraphQL */ `
  query AdminAuditStorePicker($input: AdminStoreListInput) {
    adminStores(input: $input) {
      items {
        id
        storeName
        isActive
      }
    }
  }
`);
/** 작업자는 판매자·관리자다. 관리자 목록은 검색어를 받지 않아 한 번에 받아 여기서 거른다(관리자는 소수) */
const AdminAuditActorPickerDocument = graphql(/* GraphQL */ `
  query AdminAuditActorPicker($sellers: AdminSellerListInput, $admins: CursorInput) {
    adminSellers(input: $sellers) {
      items {
        accountId
        username
        name
      }
    }
    adminAdmins(input: $admins) {
      items {
        accountId
        username
        name
      }
    }
  }
`);

export function auditLogsQueryOptions(input: AdminAuditLogListInput) {
  return queryOptions({
    queryKey: keys.list(input),
    queryFn: async () => (await gqlRequest(AdminAuditLogsDocument, { input })).adminAuditLogs,
    placeholderData: (p) => p,
  });
}

const PICKER_LIMIT = 20;

export function storePickerQuery(keyword: string) {
  return queryOptions({
    queryKey: keys.storePicker(keyword),
    queryFn: async () =>
      (
        await gqlRequest(AdminAuditStorePickerDocument, {
          input: { keyword: keyword || null, limit: PICKER_LIMIT },
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

export function actorPickerQuery(keyword: string) {
  return queryOptions({
    queryKey: keys.actorPicker(keyword),
    queryFn: async () =>
      gqlRequest(AdminAuditActorPickerDocument, {
        sellers: { keyword: keyword || null, limit: PICKER_LIMIT },
        admins: { limit: 100 },
      }),
    select: (data): EntityOption[] => {
      const k = keyword.toLowerCase();
      const option = (
        a: { accountId: string; username?: string | null; name?: string | null },
        kind: string,
      ) => ({
        id: a.accountId,
        label: accountLabel(a.name, a.username) ?? `#${a.accountId}`,
        description: `${kind} #${a.accountId}`,
      });
      const admins = data.adminAdmins.items
        .filter((a) => !k || [a.name, a.username].some((v) => v?.toLowerCase().includes(k)))
        .map((a) => option(a, '관리자'));
      return [...admins, ...data.adminSellers.items.map((s) => option(s, '판매자'))];
    },
  });
}
