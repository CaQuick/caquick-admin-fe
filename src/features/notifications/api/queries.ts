import { type QueryClient, queryOptions } from '@tanstack/react-query';

import { graphql } from '@/graphql/generated';
import {
  type AdminNotificationBroadcastListInput,
  type AdminNotificationBroadcastsQuery,
  type AdminSendNotificationInput,
} from '@/graphql/generated/graphql';
import { gqlRequest } from '@/shared/api';
import { MAX_KEYWORD_LENGTH } from '@/shared/lib/list-search';
import { type EntityOption } from '@/shared/ui/entity-picker';

const notificationsKeys = {
  all: ['notifications'] as const,
  broadcasts: () => [...notificationsKeys.all, 'broadcasts'] as const,
  broadcastList: (input: AdminNotificationBroadcastListInput) =>
    [...notificationsKeys.broadcasts(), input] as const,
  /** broadcasts() 아래라 발송 뒤 무효화에 함께 걸린다 */
  broadcastDetail: (broadcastId: string) =>
    [...notificationsKeys.broadcasts(), 'detail', broadcastId] as const,
  activeUserCount: () => [...notificationsKeys.all, 'active-user-count'] as const,
  userOptions: (keyword: string) => [...notificationsKeys.all, 'user-options', keyword] as const,
};

const AdminNotificationBroadcastsDocument = graphql(/* GraphQL */ `
  query AdminNotificationBroadcasts($input: AdminNotificationBroadcastListInput) {
    adminNotificationBroadcasts(input: $input) {
      items {
        id
        type
        title
        body
        targetKind
        targetCount
        skippedCount
        deliveredCount
        status
        actorAccountId
        actorLabel
        requestedAt
        completedAt
        targetAccountIds
        skippedAccountIds
      }
      totalCount
      hasMore
      nextCursor
    }
  }
`);
export type Broadcast =
  AdminNotificationBroadcastsQuery['adminNotificationBroadcasts']['items'][number];

const AdminNotificationBroadcastDocument = graphql(/* GraphQL */ `
  query AdminNotificationBroadcast($broadcastId: ID!) {
    adminNotificationBroadcast(broadcastId: $broadcastId) {
      id
      type
      title
      body
      targetKind
      targetCount
      skippedCount
      deliveredCount
      status
      actorAccountId
      actorLabel
      requestedAt
      completedAt
      targetAccountIds
      skippedAccountIds
    }
  }
`);

const AdminSendNotificationDocument = graphql(/* GraphQL */ `
  mutation AdminSendNotification($input: AdminSendNotificationInput!) {
    adminSendNotification(input: $input) {
      sentCount
      skippedAccountIds
      broadcastId
    }
  }
`);

const AdminNotificationActiveUserCountDocument = graphql(/* GraphQL */ `
  query AdminNotificationActiveUserCount {
    adminUsers(input: { status: ACTIVE, limit: 1 }) {
      totalCount
    }
  }
`);

const AdminNotificationUserOptionsDocument = graphql(/* GraphQL */ `
  query AdminNotificationUserOptions($input: AdminUserListInput) {
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

export const BROADCAST_POLL_MS = 5_000;

/** 저장 중인 발송이 있으면 진행 수를 따라가도록 다시 읽는다 */
export function broadcastPollInterval(
  items: readonly Pick<Broadcast, 'status'>[] | undefined,
): number | false {
  return items?.some((b) => b.status === 'IN_PROGRESS') ? BROADCAST_POLL_MS : false;
}

export function broadcastsQueryOptions(input: AdminNotificationBroadcastListInput) {
  return queryOptions({
    queryKey: notificationsKeys.broadcastList(input),
    queryFn: async () =>
      (await gqlRequest(AdminNotificationBroadcastsDocument, { input }))
        .adminNotificationBroadcasts,
    placeholderData: (prev) => prev,
    refetchInterval: (query) => broadcastPollInterval(query.state.data?.items),
  });
}

/** 발송 이력 1건. 목록의 페이지·필터와 상관없이 주소의 ID로 읽는다. 없으면 null */
export function broadcastQueryOptions(broadcastId: string) {
  return queryOptions({
    queryKey: notificationsKeys.broadcastDetail(broadcastId),
    queryFn: async () =>
      (await gqlRequest(AdminNotificationBroadcastDocument, { broadcastId }))
        .adminNotificationBroadcast ?? null,
    refetchInterval: (query) => {
      const b = query.state.data;
      return broadcastPollInterval(b ? [b] : undefined);
    },
  });
}

/** 전체 발송 확인 창의 '약 N명'. 발송 시점과 차이가 있을 수 있어 대략으로만 보인다 */
export function activeUserCountQueryOptions() {
  return queryOptions({
    queryKey: notificationsKeys.activeUserCount(),
    queryFn: async () =>
      (await gqlRequest(AdminNotificationActiveUserCountDocument)).adminUsers.totalCount,
  });
}

/** 받을 구매자 검색. 정지·탈퇴 계정은 어차피 제외되므로 이용 중인 계정만 찾는다 */
export function userOptionsQueryOptions(keyword: string) {
  return queryOptions({
    queryKey: notificationsKeys.userOptions(keyword),
    queryFn: async () =>
      (
        await gqlRequest(AdminNotificationUserOptionsDocument, {
          input: {
            keyword: keyword === '' ? null : [...keyword].slice(0, MAX_KEYWORD_LENGTH).join(''),
            status: 'ACTIVE',
            limit: 20,
          },
        })
      ).adminUsers.items,
    select: (items): EntityOption[] =>
      items.map((u) => ({
        id: u.accountId,
        label: u.nickname ?? u.name ?? u.email ?? `#${u.accountId}`,
        description: `ID ${u.accountId}`,
      })),
  });
}

export async function sendNotification(qc: QueryClient, input: AdminSendNotificationInput) {
  const r = (await gqlRequest(AdminSendNotificationDocument, { input })).adminSendNotification;
  await qc.invalidateQueries({ queryKey: notificationsKeys.broadcasts() });
  return r;
}
