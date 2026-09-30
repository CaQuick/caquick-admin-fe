/** 관리자 목록에서 비밀번호를 초기화할 수 없는 행의 이유. null이면 초기화할 수 있다 */
export function resetBlockedReason(
  row: { accountId: string; username: string | null },
  meId: string | undefined,
): string | null {
  if (meId === undefined) return '내 계정 정보를 불러오는 중입니다.';
  // 본인은 현재 비밀번호를 확인하는 변경 화면만 쓴다(BE CANNOT_RESET_OWN_PASSWORD)
  if (row.accountId === meId) return '본인 비밀번호는 비밀번호 변경 화면에서 바꿔 주세요.';
  // 아이디가 없으면 비밀번호 로그인 계정이 아니다(BE ACCOUNT_NOT_FOUND)
  if (row.username === null) {
    return '아이디가 없는 계정은 비밀번호로 로그인하지 않아 초기화할 수 없습니다.';
  }
  return null;
}
