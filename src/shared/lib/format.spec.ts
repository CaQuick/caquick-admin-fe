import { formatCount, formatKrw } from './format';

describe('format', () => {
  it('원화·건수에 천 단위 구분', () => {
    expect(formatKrw(4812000)).toBe('4,812,000원');
    expect(formatCount(0)).toBe('0');
  });
});
