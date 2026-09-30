import { type AccountStatus, type IdentityProvider } from '@/graphql/generated/graphql';
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

const IDENTITY_PROVIDER_LABEL: Record<IdentityProvider, string> = {
  GOOGLE: '구글',
  KAKAO: '카카오',
};

/** 로그인 수단 목록 → '카카오, 구글'. 없으면 '—'. 모르는 값은 원문 그대로 둔다 */
export function identityProvidersLabel(providers: readonly string[]): string {
  if (providers.length === 0) return '—';
  return providers.map((p) => IDENTITY_PROVIDER_LABEL[p as IdentityProvider] ?? p).join(', ');
}
