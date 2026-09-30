import { ORDER_STATUS, isCancelable, orderStatusMeta } from './status';

describe('order status', () => {
  it.each([
    ['SUBMITTED', true],
    ['CONFIRMED', true],
    ['MADE', true],
    ['PICKED_UP', false],
    ['CANCELED', false],
  ] as const)('%s 취소 가능=%s', (status, ok) => {
    expect(isCancelable(status)).toBe(ok);
  });

  // '확인'은 버튼처럼 읽혀 판매자가 주문을 받아들인 단계를 '주문 확정'으로 부른다
  it.each([
    ['SUBMITTED', '접수'],
    ['CONFIRMED', '주문 확정'],
    ['MADE', '제작 완료'],
    ['PICKED_UP', '픽업 완료'],
    ['CANCELED', '취소'],
  ] as const)('%s 라벨은 %s', (status, label) => {
    expect(orderStatusMeta(status).label).toBe(label);
  });

  it('모든 상태에 라벨·톤이 있다', () => {
    for (const s of ORDER_STATUS) expect(orderStatusMeta(s.value)).toEqual(s);
  });
});
