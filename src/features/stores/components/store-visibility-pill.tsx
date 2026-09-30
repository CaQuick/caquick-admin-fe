import { StatusPill } from '@/shared/ui/status-pill';

/** 구매자 화면 노출 여부(isActive) */
export function StoreVisibilityPill({ isActive }: { isActive: boolean }) {
  return (
    <StatusPill tone={isActive ? 'positive' : 'neutral'}>{isActive ? '노출' : '숨김'}</StatusPill>
  );
}
