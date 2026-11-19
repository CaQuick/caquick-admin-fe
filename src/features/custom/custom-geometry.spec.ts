import { areaToPercent, splitCustomImages } from './custom-geometry';

describe('areaToPercent', () => {
  it.each([
    ['바탕 전체', [0, 0, 10000, 10000], ['0%', '0%', '100%', '100%']],
    ['소수 둘째 자리', [1234, 5678, 100, 1], ['12.34%', '56.78%', '1%', '0.01%']],
    ['오른쪽 아래 끝 1칸', [9999, 9999, 1, 1], ['99.99%', '99.99%', '0.01%', '0.01%']],
    ['넘치는 크기는 바탕 끝까지', [5000, 2500, 6000, 9000], ['50%', '25%', '50%', '75%']],
    ['범위 밖 시작점은 가장자리로', [-10, 12000, 100, 100], ['0%', '100%', '1%', '0%']],
    ['음수 크기는 0', [100, 100, -5, -1], ['1%', '1%', '0%', '0%']],
    ['숫자가 아니면 0', [Number.NaN, 0, Number.POSITIVE_INFINITY, 10], ['0%', '0%', '0%', '0.1%']],
  ])('%s', (_, [posX, posY, width, height], [left, top, w, h]) => {
    expect(areaToPercent({ posX: posX!, posY: posY!, width: width!, height: height! })).toEqual({
      left,
      top,
      width: w,
      height: h,
    });
  });
});

const img = (kind: string) => ({ kind, imageUrl: `https://img.test/${kind}.png` });
const kinds = (list: readonly { kind: string }[]) => list.map((i) => i.kind);

describe('splitCustomImages', () => {
  it('3D 5장은 받은 순서와 관계없이 윗면 → 앞·뒤·왼·오다', () => {
    const r = splitCustomImages(
      ['THREE_D_RIGHT', 'THREE_D_BACK', 'THREE_D_TOP', 'THREE_D_LEFT', 'THREE_D_FRONT'].map(img),
    );
    expect(r.top?.kind).toBe('THREE_D_TOP');
    expect(kinds(r.sides)).toEqual([
      'THREE_D_FRONT',
      'THREE_D_BACK',
      'THREE_D_LEFT',
      'THREE_D_RIGHT',
    ]);
    expect(r.composite).toBeNull();
  });

  it('슬롯형 합성은 렌더와 따로 나온다', () => {
    const r = splitCustomImages([img('SLOT_COMPOSITE')]);
    expect(r).toEqual({ top: null, sides: [], composite: img('SLOT_COMPOSITE') });
  });

  it('모르는 종류는 버리지 않고 옆면 뒤에 받은 순서대로 둔다', () => {
    const r = splitCustomImages(['HOLOGRAM', 'THREE_D_LEFT', 'THREE_D_TOP', 'BOTTOM'].map(img));
    expect(r.top?.kind).toBe('THREE_D_TOP');
    expect(kinds(r.sides)).toEqual(['THREE_D_LEFT', 'HOLOGRAM', 'BOTTOM']);
  });

  it('윗면이 없으면 렌더는 전부 옆면 자리에 둔다', () => {
    const r = splitCustomImages(['THREE_D_BACK', 'THREE_D_FRONT'].map(img));
    expect(r.top).toBeNull();
    expect(kinds(r.sides)).toEqual(['THREE_D_FRONT', 'THREE_D_BACK']);
  });

  it('이미지가 없으면 모두 비어 있고 입력 배열은 바꾸지 않는다', () => {
    expect(splitCustomImages([])).toEqual({ top: null, sides: [], composite: null });
    const input = Object.freeze(['THREE_D_FRONT', 'THREE_D_TOP'].map(img));
    expect(() => splitCustomImages(input)).not.toThrow();
  });
});
