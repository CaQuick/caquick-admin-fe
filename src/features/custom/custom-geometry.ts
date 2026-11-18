/** 커스텀 좌표는 바탕 이미지 한 변을 10000으로 본 정수 비율이고 원점은 왼쪽 위다 */
const SCALE = 10000;

interface Area {
  posX: number;
  posY: number;
  width: number;
  height: number;
}

const clamp = (v: number, max: number) => Math.min(Math.max(Number.isFinite(v) ? v : 0, 0), max);
const percent = (v: number) => `${v / 100}%`;

/** 바탕 위 영역을 CSS 백분율 위치로 바꾼다. 범위 밖 값은 바탕 안으로 자른다 */
export function areaToPercent(a: Area) {
  const left = clamp(a.posX, SCALE);
  const top = clamp(a.posY, SCALE);
  return {
    left: percent(left),
    top: percent(top),
    width: percent(clamp(a.width, SCALE - left)),
    height: percent(clamp(a.height, SCALE - top)),
  };
}

const RENDER_ORDER: readonly string[] = [
  'THREE_D_TOP',
  'THREE_D_FRONT',
  'THREE_D_BACK',
  'THREE_D_LEFT',
  'THREE_D_RIGHT',
];

/**
 * 커스텀 이미지를 윗면 · 옆면(앞·뒤·왼·오) · 슬롯형 합성으로 나눈다.
 * 모르는 종류는 버리지 않고 옆면 뒤에 받은 순서대로 둔다.
 */
export function splitCustomImages<T extends { kind: string }>(images: readonly T[]) {
  const rank = (kind: string) => {
    const i = RENDER_ORDER.indexOf(kind);
    return i === -1 ? RENDER_ORDER.length : i;
  };
  const renders = images
    .filter((i) => i.kind !== 'SLOT_COMPOSITE')
    .sort((a, b) => rank(a.kind) - rank(b.kind));
  const top = renders[0]?.kind === 'THREE_D_TOP' ? renders[0] : null;
  return {
    top,
    sides: top ? renders.slice(1) : renders,
    composite: images.find((i) => i.kind === 'SLOT_COMPOSITE') ?? null,
  };
}
