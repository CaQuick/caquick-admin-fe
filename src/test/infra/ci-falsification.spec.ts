// 반증: 집계 잡 확인용 — 되돌림. CI(GITHUB_ACTIONS)에서만 실패해 로컬 pre-push는 통과한다
it('반증: 집계 잡 확인용 — 되돌림', () => {
  const ci: unknown = import.meta.env.GITHUB_ACTIONS;
  expect(ci).toBeUndefined();
});
