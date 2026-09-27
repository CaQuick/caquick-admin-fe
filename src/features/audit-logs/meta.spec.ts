import {
  actionMeta,
  auditSearchSchema,
  hasAuditFilters,
  prettyJson,
  targetLabel,
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
