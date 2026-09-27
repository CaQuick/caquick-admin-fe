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

  it('모든 상태에 라벨·톤이 있다', () => {
    for (const s of ORDER_STATUS) expect(orderStatusMeta(s.value)).toEqual(s);
  });
});
