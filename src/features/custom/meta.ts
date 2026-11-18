import {
  type CustomImageKindType,
  type CustomModeType,
  type CustomTextAlignType,
} from '@/graphql/generated/graphql';

// Record라 codegen enum에 값이 늘면 tsc가 잡는다. 화면은 BE가 먼저 배포돼 모르는 값이 와도 원문으로 보인다
const MODE: Record<CustomModeType, string> = { NONE: '없음', SLOT: '슬롯형', THREE_D: '3D' };
const ALIGN: Record<CustomTextAlignType, string> = {
  LEFT: '왼쪽',
  CENTER: '가운데',
  RIGHT: '오른쪽',
};
const IMAGE_KIND: Record<CustomImageKindType, string> = {
  THREE_D_TOP: '윗면',
  THREE_D_FRONT: '앞',
  THREE_D_BACK: '뒤',
  THREE_D_LEFT: '왼쪽',
  THREE_D_RIGHT: '오른쪽',
  SLOT_COMPOSITE: '합성 이미지',
};

/** 표에 있는 값만 라벨로 바꾼다. `constructor` 같은 프로토타입 키도 모르는 값이다 */
const label = (table: Record<string, string>, value: string) =>
  Object.hasOwn(table, value) ? table[value]! : value;

export const customModeLabel = (v: string) => label(MODE, v);
export const textAlignLabel = (v: string) => label(ALIGN, v);
export const imageKindLabel = (v: string) => label(IMAGE_KIND, v);

export type SlotTextState = 'DEFAULT' | 'CHANGED' | 'EMPTY';
export const SLOT_TEXT_STATE_LABEL: Record<SlotTextState, string> = {
  DEFAULT: '기본 그대로',
  CHANGED: '바꿈',
  EMPTY: '문구 없음',
};

/** BE는 문구를 CRLF→LF·trim해 저장하므로 기본 문구도 같은 규칙으로 맞춰 비교한다 */
export function slotTextState(t: { defaultText: string; valueText: string | null }): SlotTextState {
  if (t.valueText === null || t.valueText === '') return 'EMPTY';
  return t.valueText === t.defaultText.replaceAll('\r\n', '\n').trim() ? 'DEFAULT' : 'CHANGED';
}
