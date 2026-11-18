import { buildSchema, isEnumType } from 'graphql';

// codegen이 읽는 SDL 스냅샷 원문. 손으로 적은 라벨 표와 대조하는 정답지다
import sdl from '../../../schema/schema.graphql?raw';

import {
  customModeLabel,
  imageKindLabel,
  SLOT_TEXT_STATE_LABEL,
  slotTextState,
  textAlignLabel,
} from './meta';

function enumValues(name: string): string[] {
  const t = buildSchema(sdl).getType(name);
  if (!isEnumType(t)) throw new Error(`${name} enum이 스키마에 없다`);
  return t.getValues().map((v) => v.name);
}

const TABLES = [
  ['CustomModeType', customModeLabel],
  ['CustomTextAlignType', textAlignLabel],
  ['CustomImageKindType', imageKindLabel],
] as const;

describe('커스텀 enum 라벨', () => {
  it.each(TABLES)('%s 값이 스키마에 있다(정답지가 비어 통과하지 않게)', (name) => {
    expect(enumValues(name).length).toBeGreaterThanOrEqual(3);
  });

  it.each(TABLES.flatMap(([name, fn]) => enumValues(name).map((v) => [name, v, fn] as const)))(
    '%s.%s는 원문이 아닌 한국어 라벨로 보인다',
    (_, value, fn) => {
      expect(fn(value)).not.toBe(value);
    },
  );

  it.each([['HOLOGRAM'], ['constructor'], ['toString'], ['']])(
    '모르는 값 %j는 원문으로 보인다',
    (value) => {
      for (const [, fn] of TABLES) expect(fn(value)).toBe(value);
    },
  );

  it('대표 라벨', () => {
    expect([customModeLabel('SLOT'), customModeLabel('THREE_D')]).toEqual(['슬롯형', '3D']);
    expect(textAlignLabel('CENTER')).toBe('가운데');
    expect(imageKindLabel('THREE_D_TOP')).toBe('윗면');
  });
});

describe('slotTextState', () => {
  it.each([
    ['기본 문구 그대로', 'DEFAULT', '축하해', '축하해'],
    [
      '기본 문구의 CRLF·앞뒤 공백은 저장 규칙대로 맞춰 본다',
      'DEFAULT',
      ' 생일\r\n축하해 ',
      '생일\n축하해',
    ],
    ['기본 문구의 홀로 있는 CR도 LF로 맞춰 본다', 'DEFAULT', '생일\r축하해', '생일\n축하해'],
    ['바꾼 문구', 'CHANGED', '축하해', '서연아 생일 축하해 🎂'],
    ['줄바꿈만 다름', 'CHANGED', '생일 축하해', '생일\n축하해'],
    ['선택 자리를 지움(null)', 'EMPTY', '축하해', null],
    ['빈 문자열', 'EMPTY', '축하해', ''],
    ['기본 문구가 비어 있고 입력도 없음', 'EMPTY', '', null],
  ] as const)('%s → %s', (_, state, defaultText, valueText) => {
    expect(slotTextState({ defaultText, valueText })).toBe(state);
  });

  it('상태마다 라벨이 있다', () => {
    expect(SLOT_TEXT_STATE_LABEL).toEqual({
      DEFAULT: '기본 그대로',
      CHANGED: '바꿈',
      EMPTY: '문구 없음',
    });
  });
});
