import { type OrderActorType, type SettlementStatusType } from '@/graphql/generated/graphql';
import { type PillTone } from '@/shared/ui/status-pill';

// Record라 codegen enum에 값이 늘면 tsc가 잡는다. 화면은 모르는 값이 와도 원문으로 보인다
const STATUS: Record<SettlementStatusType, { label: string; tone: PillTone }> = {
  PENDING: { label: '송금 대기', tone: 'caution' },
  PAID: { label: '송금 완료', tone: 'positive' },
};
const ACTOR: Record<OrderActorType, string> = {
  BUYER: '구매자',
  SELLER: '판매자',
  ADMIN: '관리자',
  SYSTEM: '시스템',
};

export const SETTLEMENT_STATUS_VALUES = Object.keys(STATUS) as [
  SettlementStatusType,
  ...SettlementStatusType[],
];
/** `constructor` 같은 프로토타입 키도 모르는 값이다 */
export const settlementStatusMeta = (v: string) =>
  Object.hasOwn(STATUS, v)
    ? STATUS[v as SettlementStatusType]
    : { label: v, tone: 'neutral' as const };
export const actorLabel = (v: string) => (Object.hasOwn(ACTOR, v) ? ACTOR[v as OrderActorType] : v);
