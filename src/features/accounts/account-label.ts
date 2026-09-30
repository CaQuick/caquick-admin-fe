/** 앞뒤 공백을 뺀 값. 비었으면 없는 것으로 본다 */
function present(v: string | null | undefined): string | null {
  const t = v?.trim() ?? '';
  return t === '' ? null : t;
}

/**
 * 관리자 화면의 계정 표시 라벨. BE formatAccountLabel과 같은 규칙이다:
 * `이름(아이디)`, 한쪽만 있으면 그 값, 둘 다 없으면 `#계정ID`.
 */
export function accountLabel(a: {
  accountId: string;
  name?: string | null;
  username?: string | null;
}): string {
  const name = present(a.name);
  const username = present(a.username);
  if (name && username) return `${name}(${username})`;
  return name ?? username ?? `#${a.accountId}`;
}
