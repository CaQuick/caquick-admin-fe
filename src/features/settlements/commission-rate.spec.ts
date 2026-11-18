import { bpsToPercent, percentToBps } from './commission-rate';

describe('수수료율 변환', () => {
  it.each([
    ['5.55', 555],
    ['5.5', 550],
    ['5.05', 505],
    ['0.01', 1],
    ['0', 0],
    ['0.0', 0],
    ['100', 10_000],
    ['100.00', 10_000],
    [' 7 ', 700],
    ['007', 700],
  ])('퍼센트 %s → %i bp', (text, bps) => {
    expect(percentToBps(text)).toBe(bps);
  });

  it.each([
    ['5.555', '소수 셋째 자리'],
    ['100.01', '100% 초과'],
    ['101', '100% 초과'],
    ['1000', '네 자리 정수'],
    ['-1', '음수'],
    ['', '빈 값'],
    ['.5', '정수부 없음'],
    ['5.', '소수부 없음'],
    ['1e2', '지수 표기'],
    ['5,5', '쉼표'],
    ['5%', '퍼센트 기호'],
    ['５', '전각 숫자'],
  ])('%s(%s)는 거절한다', (text) => {
    expect(percentToBps(text)).toBeNull();
  });

  it.each([
    [555, '5.55'],
    [550, '5.5'],
    [500, '5'],
    [505, '5.05'],
    [5, '0.05'],
    [0, '0'],
    [10_000, '100'],
  ])('%i bp → %s%%', (bps, text) => {
    expect(bpsToPercent(bps)).toBe(text);
  });

  it('0~10000 bp 전부가 퍼센트 문자열을 거쳐 같은 bp로 돌아온다', () => {
    const broken = Array.from({ length: 10_001 }, (_, bps) => bps).filter(
      (bps) => percentToBps(bpsToPercent(bps)) !== bps,
    );
    expect(broken).toEqual([]);
  });
});
