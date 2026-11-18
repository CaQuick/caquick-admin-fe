import { formatKrw } from '@/shared/lib/format';

interface OptionGroupLike {
  isActive: boolean;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  optionItems: readonly { isActive: boolean }[];
}

export interface OptionGroupWarning {
  /** 배지 문구 */
  label: string;
  /** 툴팁·접근 설명 문구 */
  reason: string;
  /** true면 구매자가 이 상품을 주문할 수 없다 */
  blocksOrder: boolean;
}

/**
 * 주문 체크아웃이 거절하는 옵션 구성을 미리 알린다. 기준은 BE 체크아웃과 같다.
 * - 숨긴 그룹·선택지는 구매자에게 보이지 않고 체크아웃도 보지 않는다.
 * - 필수 그룹은 노출 선택지 중 최소 개수 이상을 골라야 한다.
 */
export function optionGroupWarnings(group: OptionGroupLike): OptionGroupWarning[] {
  if (!group.isActive || !group.isRequired) return [];
  const visible = group.optionItems.filter((i) => i.isActive).length;
  if (visible >= group.minSelect) return [];
  return [
    {
      label: '주문 불가',
      reason:
        visible === 0
          ? '필수 그룹에 노출 중인 선택지가 없어 구매자가 이 상품을 주문할 수 없습니다.'
          : `필수 그룹에 노출 중인 선택지가 ${visible}개뿐이라 최소 ${group.minSelect}개를 고를 수 없습니다. 구매자가 이 상품을 주문할 수 없습니다.`,
      blocksOrder: true,
    },
  ];
}

/** 고를 수 있는 개수. 'n개 선택'·'최대 n개 선택'·'min~max개 선택' */
export function selectionRule(group: Pick<OptionGroupLike, 'minSelect' | 'maxSelect'>): string {
  const { minSelect: min, maxSelect: max } = group;
  if (min === max) return `${min}개 선택`;
  return min === 0 ? `최대 ${max}개 선택` : `${min}~${max}개 선택`;
}

/** 선택지 가격 증감. 음수는 할인이라 빼기 기호(−)로 보인다 */
export function formatPriceDelta(delta: number): string {
  if (delta === 0) return '추가 금액 없음';
  return delta > 0 ? `+${formatKrw(delta)}` : `−${formatKrw(-delta)}`;
}
