import { StatusPill } from '@/shared/ui/status-pill';

/** 매장 isActive — 구매자 앱에 보이는지. 공개 여부 용어는 노출/숨김으로 통일한다 */
export function StoreVisibilityPill({ isActive }: { isActive: boolean }) {
  return (
    <StatusPill tone={isActive ? 'positive' : 'neutral'}>{isActive ? '노출' : '숨김'}</StatusPill>
  );
}
