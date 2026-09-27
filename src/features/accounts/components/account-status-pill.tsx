import { type AccountStatus } from '@/graphql/generated/graphql';
import { StatusPill } from '@/shared/ui/status-pill';

import { accountStatusMeta } from '../status';

export function AccountStatusPill({ status }: { status: AccountStatus }) {
  const meta = accountStatusMeta(status);
  return <StatusPill tone={meta.tone}>{meta.label}</StatusPill>;
}
