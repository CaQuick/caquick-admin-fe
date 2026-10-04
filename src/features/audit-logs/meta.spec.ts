import { buildSchema, isEnumType } from 'graphql';

// vite의 ?raw 가져오기 — codegen이 읽는 SDL 스냅샷 원문. 타입 수준 검사는 meta.ts의 Record가 맡는다
import sdl from '../../../schema/schema.graphql?raw';

import {
  accountLabel,
  actionMeta,
  actorTypeLabel,
  auditSearchSchema,
  diffRows,
  hasAuditFilters,
  prettyJson,
  targetLabel,
  TARGET_TYPES,
  toAuditListInput,
} from './meta';

describe('audit meta', () => {
  it('입력 변환: 기본값·필터·KST 경계', () => {
    expect(toAuditListInput(auditSearchSchema.parse({}))).toEqual({
      limit: 20,
      cursor: null,
      actorAccountId: null,
      storeId: null,
      targetType: null,
      targetId: null,
      action: null,
      fromCreatedAt: null,
      toCreatedAt: null,
    });
    const s = auditSearchSchema.parse({
      targetType: 'ORDER',
      targetId: 7,
      action: 'STATUS_CHANGE',
      actorId: '1',
      from: '2026-09-01',
      to: '2026-13-01',
    });
    expect(toAuditListInput(s)).toMatchObject({
      targetType: 'ORDER',
      targetId: '7',
      action: 'STATUS_CHANGE',
      actorAccountId: '1',
      fromCreatedAt: '2026-08-31T15:00:00.000Z',
      toCreatedAt: null,
    });
    expect(hasAuditFilters(s)).toBe(true);
    expect(auditSearchSchema.parse({ targetType: 'NOPE', action: 'X' })).toMatchObject({
      targetType: undefined,
      action: undefined,
    });
  });

  it('라벨·JSON 정리', () => {
    expect(targetLabel('REVIEW_COMMENT')).toBe('리뷰 댓글');
    expect(targetLabel('UNKNOWN')).toBe('UNKNOWN');
    expect(actionMeta('DELETE').tone).toBe('negative');
    expect(actionMeta('ZZ').label).toBe('ZZ');
    expect(prettyJson('{"a":1}')).toBe('{\n  "a": 1\n}');
    expect(prettyJson('not json')).toBe('not json');
    expect(prettyJson(null)).toBe('');
  });
});

describe('작업자 표시', () => {
  it.each([
    ['ADMIN', '관리자'],
    ['SELLER', '판매자'],
    ['USER', '구매자'],
    [null, '삭제된 계정'],
    [undefined, '삭제된 계정'],
    ['ROBOT', 'ROBOT'],
  ])('계정 종류 %s → %s', (type, label) => {
    expect(actorTypeLabel(type)).toBe(label);
  });

  it.each([
    ['이찬우', 'chanwoo7', '이찬우(chanwoo7)'],
    ['이찬우', null, '이찬우'],
    [null, 'chanwoo7', 'chanwoo7'],
    [null, null, null],
  ])('이름 %s · 아이디 %s → %s', (name, username, label) => {
    expect(accountLabel(name, username)).toBe(label);
  });
});

describe('변경 전·후 항목 표', () => {
  it('두 쪽의 키를 합쳐 한국어 항목명으로 펴고 바뀐 값만 표시한다', () => {
    expect(
      diffRows(
        '{"status":"CONFIRMED","isActive":true,"custom_key":1}',
        '{"status":"CANCELED","isActive":true,"note":null,"extra":{"a":[1]}}',
      ),
    ).toEqual([
      { key: 'status', label: '상태', before: 'CONFIRMED', after: 'CANCELED', changed: true },
      { key: 'isActive', label: '노출', before: '예', after: '예', changed: false },
      { key: 'custom_key', label: 'custom_key', before: '1', after: '—', changed: true },
      { key: 'note', label: '메모', before: '—', after: '—', changed: false },
      { key: 'extra', label: 'extra', before: '—', after: '{"a":[1]}', changed: true },
    ]);
  });

  it.each([
    ['생성(변경 전 없음)', null, '{"name":"a","isActive":false}'],
    ['삭제(변경 후 없음)', '{"name":"a","isActive":false}', null],
  ])('%s은 값을 보이되 바뀜 표시를 하지 않는다', (_, before, after) => {
    const rows = diffRows(before, after)!;
    expect(rows.map((r) => [r.label, r.changed])).toEqual([
      ['이름', false],
      ['노출', false],
    ]);
    expect(rows[1]![before ? 'before' : 'after']).toBe('아니오');
  });

  it.each([
    ['둘 다 없음', null, null],
    ['빈 문자열', '', ''],
    ['깨진 JSON', '{"a":', '{"a":1}'],
    ['배열', '[1,2]', '{"a":1}'],
    ['원시값', '{"a":1}', '"text"'],
    ['null JSON', 'null', '{"a":1}'],
  ])('%s이면 표를 만들지 않는다(원문만 보인다)', (_, before, after) => {
    expect(diffRows(before, after)).toBeNull();
  });
});

/** 스냅샷의 AuditTargetType 값 전부. 손으로 적은 목록과 대조하는 정답지 */
function schemaTargetTypes(): string[] {
  const t = buildSchema(sdl).getType('AuditTargetType');
  if (!isEnumType(t)) throw new Error('AuditTargetType enum이 스키마에 없다');
  return t.getValues().map((v) => v.name);
}

describe('감사 대상 유형 라벨', () => {
  it('스키마의 대상 유형은 10개 이상이다(정답지가 비어 통과하지 않게)', () => {
    expect(schemaTargetTypes().length).toBeGreaterThanOrEqual(10);
  });

  it.each(schemaTargetTypes())('%s는 원문이 아닌 한국어 라벨로 보이고 필터에 나온다', (value) => {
    expect(TARGET_TYPES.filter((t) => t.value === value)).toHaveLength(1);
    expect(targetLabel(value)).not.toBe(value);
  });

  it('스키마에 없는 유형은 라벨 표에도 없다', () => {
    const known = new Set(schemaTargetTypes());
    expect(TARGET_TYPES.map((t) => t.value).filter((v) => !known.has(v))).toEqual([]);
  });

  it('검색 칩은 검색 칩으로 보이고, 변경 전·후 항목도 한국어로 보인다', () => {
    expect(targetLabel('SEARCH_KEYWORD_CHIP')).toBe('검색 칩');
    const snapshot =
      '{"keyword":"생일","sortOrder":1,"isActive":true,"startsAt":null,"endsAt":null}';
    expect(diffRows(null, snapshot)!.map((r) => r.label)).toEqual([
      '키워드',
      '정렬 순서',
      '노출',
      '노출 시작',
      '노출 종료',
    ]);
  });
});
