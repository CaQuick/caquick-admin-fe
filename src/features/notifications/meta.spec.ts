import {
  BROADCAST_STATUS,
  actorText,
  notificationsSearchSchema,
  targetSummary,
  toBroadcastListInput,
} from './meta';

describe('notification meta', () => {
  it.each([
    { kind: 'ALL_USERS' as const, count: 1234, want: '전체 구매자' },
    { kind: 'ACCOUNT_IDS' as const, count: 0, want: '지정 0명' },
    { kind: 'ACCOUNT_IDS' as const, count: 1234, want: '지정 1,234명' },
  ])('대상 요약: $kind $count → $want', ({ kind, count, want }) => {
    expect(targetSummary(kind, count)).toBe(want);
  });

  it.each([
    { label: '이찬우(chanwoo7)', id: '3', want: '이찬우(chanwoo7)' },
    { label: null, id: '3', want: '#3' },
    { label: undefined, id: '0', want: '#0' },
  ])('보낸 사람 표시: $label → $want', ({ label, id, want }) => {
    expect(actorText(label, id)).toBe(want);
  });

  it.each([
    { status: 'IN_PROGRESS' as const, label: '보내는 중', tone: 'primary' },
    { status: 'COMPLETED' as const, label: '완료', tone: 'positive' },
    { status: 'DELAYED' as const, label: '지연', tone: 'caution' },
  ])('상태 라벨: $status → $label', ({ status, label, tone }) => {
    expect(BROADCAST_STATUS[status]).toMatchObject({ label, tone });
  });

  it.each([
    { raw: {}, want: { limit: 20, cursor: null, type: null, targetKind: null } },
    {
      raw: { type: 'MARKETING', targetKind: 'ACCOUNT_IDS', cursor: '41', limit: '50' },
      want: { limit: 50, cursor: '41', type: 'MARKETING', targetKind: 'ACCOUNT_IDS' },
    },
    {
      raw: { type: 'ORDER', targetKind: 'SOMEONE' },
      want: { limit: 20, cursor: null, type: null, targetKind: null },
    },
  ])('검색 파라미터 → 목록 입력 $raw', ({ raw, want }) => {
    expect(toBroadcastListInput(notificationsSearchSchema.parse(raw))).toEqual(want);
  });

  it.each([
    { raw: '7', want: '7' },
    { raw: 0, want: '0' },
    { raw: '18446744073709551615', want: '18446744073709551615' },
    { raw: 'abc', want: undefined },
    { raw: '', want: undefined },
  ])('상세 시트 ID는 문자열로 보존한다: $raw', ({ raw, want }) => {
    expect(notificationsSearchSchema.parse({ broadcastId: raw }).broadcastId).toBe(want);
  });
});
