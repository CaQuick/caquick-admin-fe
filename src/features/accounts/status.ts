import { type AccountStatus } from '@/graphql/generated/graphql';
import { type PillTone } from '@/shared/ui/status-pill';

export const ACCOUNT_STATUS: { value: AccountStatus; label: string; tone: PillTone }[] = [
  { value: 'ACTIVE', label: '활성', tone: 'positive' },
  { value: 'SUSPENDED', label: '정지', tone: 'negative' },
  { value: 'PENDING', label: '대기', tone: 'neutral' },
];
export const ACCOUNT_STATUS_VALUES = ACCOUNT_STATUS.map((s) => s.value) as [
  AccountStatus,
  ...AccountStatus[],
];

export function accountStatusMeta(value: AccountStatus) {
  return (
    ACCOUNT_STATUS.find((s) => s.value === value) ?? {
      value,
      label: value,
      tone: 'neutral' as const,
    }
  );
}
