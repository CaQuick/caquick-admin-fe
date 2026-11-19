import { formatPriceDelta, optionGroupWarnings, selectionRule } from './option-rules';

const items = (...active: boolean[]) => active.map((isActive) => ({ isActive }));
const group = (over: Partial<Parameters<typeof optionGroupWarnings>[0]> = {}) => ({
  isActive: true,
  isRequired: true,
  minSelect: 1,
  maxSelect: 1,
  optionItems: items(true),
  ...over,
});
const summary = (g: Parameters<typeof optionGroupWarnings>[0]) =>
  optionGroupWarnings(g).map((w) => `${w.label}${w.blocksOrder ? '!' : ''}`);

describe('optionGroupWarnings', () => {
  it.each([
    ['필수·노출 선택지 있음', group(), []],
    ['필수·선택지 없음', group({ optionItems: [] }), ['주문 불가!']],
    ['필수·선택지가 전부 숨김', group({ optionItems: items(false, false) }), ['주문 불가!']],
    [
      '필수·노출 선택지가 최소 개수보다 적음',
      group({ minSelect: 2, maxSelect: 3, optionItems: items(true, false) }),
      ['주문 불가!'],
    ],
    [
      '필수·노출 선택지가 최소 개수와 같음',
      group({ minSelect: 2, maxSelect: 3, optionItems: items(true, true, false) }),
      [],
    ],
    ['필수지만 최소 0개·선택지 없음', group({ minSelect: 0, optionItems: [] }), []],
    ['선택 그룹·선택지 없음', group({ isRequired: false, optionItems: [] }), []],
    ['숨긴 필수 그룹·선택지 없음', group({ isActive: false, optionItems: [] }), []],
  ])('%s → %j', (_, g, expected) => {
    expect(summary(g)).toEqual(expected);
  });

  it('사유는 노출 선택지 수와 최소 개수를 알린다', () => {
    expect(optionGroupWarnings(group({ optionItems: [] }))[0]?.reason).toBe(
      '필수 그룹에 노출 중인 선택지가 없어 구매자가 이 상품을 주문할 수 없습니다.',
    );
    expect(
      optionGroupWarnings(group({ minSelect: 3, maxSelect: 3, optionItems: items(true, true) }))[0]
        ?.reason,
    ).toBe(
      '필수 그룹에 노출 중인 선택지가 2개뿐이라 최소 3개를 고를 수 없습니다. 구매자가 이 상품을 주문할 수 없습니다.',
    );
  });
});

describe('selectionRule', () => {
  it.each([
    [1, 1, '1개 선택'],
    [2, 2, '2개 선택'],
    [0, 3, '최대 3개 선택'],
    [1, 3, '1~3개 선택'],
  ])('min %i · max %i → %s', (minSelect, maxSelect, expected) => {
    expect(selectionRule({ minSelect, maxSelect })).toBe(expected);
  });
});

describe('formatPriceDelta', () => {
  it.each([
    [3000, '+3,000원'],
    [-1000, '−1,000원'],
    [0, '추가 금액 없음'],
  ])('%i → %s', (delta, expected) => {
    expect(formatPriceDelta(delta)).toBe(expected);
  });
});
