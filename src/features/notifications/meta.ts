import { z } from 'zod';

import {
  type AdminNotificationBroadcastListInput,
  type AdminNotificationBroadcastStatus,
  type AdminNotificationTargetKind,
  type AdminNotificationType,
} from '@/graphql/generated/graphql';
import { formatCount } from '@/shared/lib/format';
import { DEFAULT_LIMIT, listSearchBase, optionalIdText } from '@/shared/lib/list-search';
import { type PillTone } from '@/shared/ui/status-pill';

export const NOTIFICATION_TYPES = [
  {
    value: 'SYSTEM',
    label: '시스템',
    help: '운영 공지에 씁니다. 서비스 점검·정책 변경처럼 구매자가 꼭 알아야 할 소식을 보냅니다.',
  },
  { value: 'MARKETING', label: '마케팅', help: '프로모션·이벤트 안내에 씁니다.' },
] as const satisfies readonly { value: AdminNotificationType; label: string; help: string }[];

export const TARGET_KINDS = [
  { value: 'ALL_USERS', label: '전체 구매자' },
  { value: 'ACCOUNT_IDS', label: '구매자 지정' },
] as const satisfies readonly { value: AdminNotificationTargetKind; label: string }[];

export const BROADCAST_STATUS: Record<
  AdminNotificationBroadcastStatus,
  { label: string; tone: PillTone; help: string }
> = {
  IN_PROGRESS: {
    label: '보내는 중',
    tone: 'primary',
    help: '구매자 알림함에 저장하고 있습니다. 대상이 많으면 몇 분 걸릴 수 있습니다.',
  },
  COMPLETED: { label: '완료', tone: 'positive', help: '대상 전원에게 저장을 마쳤습니다.' },
  DELAYED: {
    label: '지연',
    tone: 'caution',
    help: '요청하고 30분이 지나도 끝나지 않았습니다. 시스템 담당자에게 확인을 요청해 주세요.',
  },
};

export const typeLabel = (v: AdminNotificationType) =>
  NOTIFICATION_TYPES.find((t) => t.value === v)?.label ?? v;

/** 목록 '대상' 칸. 지정 발송은 요청 시점에 확정된 수를 함께 보인다 */
export function targetSummary(kind: AdminNotificationTargetKind, targetCount: number): string {
  return kind === 'ALL_USERS' ? '전체 구매자' : `지정 ${formatCount(targetCount)}명`;
}

/** 발송자 표시. BE 라벨이 없으면 계정 ID로 */
export const actorText = (label: string | null | undefined, accountId: string) =>
  label ?? `#${accountId}`;

export const notificationsSearchSchema = z.object({
  ...listSearchBase,
  type: z.enum(['SYSTEM', 'MARKETING']).optional().catch(undefined),
  targetKind: z.enum(['ALL_USERS', 'ACCOUNT_IDS']).optional().catch(undefined),
  /** 상세 시트로 연 발송 이력 */
  broadcastId: optionalIdText,
});
export type NotificationsSearch = z.infer<typeof notificationsSearchSchema>;
export type NotificationsSearchInput = z.input<typeof notificationsSearchSchema>;

export function toBroadcastListInput(s: NotificationsSearch): AdminNotificationBroadcastListInput {
  return {
    limit: s.limit ?? DEFAULT_LIMIT,
    cursor: s.cursor ?? null,
    type: s.type ?? null,
    targetKind: s.targetKind ?? null,
  };
}

/** 확인 창 문구. 전체 발송은 지금 이용 중인 구매자 수로 대략을 알린다 */
export function confirmMessage(
  targetKind: AdminNotificationTargetKind,
  pickedCount: number,
  activeUsers: number | undefined,
): string {
  const who =
    targetKind === 'ACCOUNT_IDS'
      ? `고른 구매자 ${formatCount(pickedCount)}명에게`
      : activeUsers === undefined
        ? '이용 중인 구매자 전체에게'
        : `이용 중인 구매자 전체(약 ${formatCount(activeUsers)}명)에게`;
  return `${who} 보냅니다. 보낸 뒤에는 취소할 수 없습니다.`;
}
