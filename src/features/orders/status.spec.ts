import { type OrderStatusType } from '@/graphql/generated/graphql';

import { ORDER_STATUS, canCompletePickup, orderStatusMeta } from './status';

describe('order status', () => {
  // '확인'은 버튼처럼 읽혀 판매자가 주문을 받아들인 단계를 '주문 확정'으로 부른다
  it.each([
    ['PENDING_PAYMENT', '입금 대기', 'neutral', false],
    ['SUBMITTED', '접수', 'primary', false],
    ['CONFIRMED', '주문 확정', 'caution', true],
    ['MADE', '제작 완료', 'neutral', true],
    ['PICKED_UP', '픽업 완료', 'positive', false],
    ['NO_SHOW', '노쇼', 'negative', false],
    ['CANCELED', '취소', 'negative', false],
  ] satisfies [OrderStatusType, string, string, boolean][])(
    '%s는 %s(%s), 픽업 완료 처리=%s',
    (status, label, tone, pickup) => {
      expect(orderStatusMeta(status)).toEqual({ value: status, label, tone });
      expect(canCompletePickup(status)).toBe(pickup);
    },
  );

  it('필터·차트 순서는 흐름 순서 뒤에 종료 상태다', () => {
    expect(ORDER_STATUS.map((s) => s.label)).toEqual([
      '입금 대기',
      '접수',
      '주문 확정',
      '제작 완료',
      '픽업 완료',
      '노쇼',
      '취소',
    ]);
  });

  it.each(['REFUNDED', 'constructor'])('모르는 값 %s는 원문·중립 톤으로 보인다', (value) => {
    expect(orderStatusMeta(value as OrderStatusType)).toEqual({
      value,
      label: value,
      tone: 'neutral',
    });
  });
});
