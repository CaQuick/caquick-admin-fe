import { resetBlockedReason } from './reset-blocked-reason';

describe('resetBlockedReason', () => {
  it.each([
    ['다른 관리자', { accountId: '2', username: 'ops.two' }, '1', null],
    // ID는 문자열로 비교한다 — '0'도 본인으로 알아본다
    [
      '본인',
      { accountId: '0', username: 'ops.zero' },
      '0',
      '본인 비밀번호는 비밀번호 변경 화면에서 바꿔 주세요.',
    ],
    [
      '본인이면서 아이디 없음',
      { accountId: '1', username: null },
      '1',
      '본인 비밀번호는 비밀번호 변경 화면에서 바꿔 주세요.',
    ],
    [
      '아이디 없는 계정',
      { accountId: '3', username: null },
      '1',
      '아이디가 없는 계정은 비밀번호로 로그인하지 않아 초기화할 수 없습니다.',
    ],
    [
      '내 정보 로딩 전',
      { accountId: '2', username: 'ops.two' },
      undefined,
      '내 계정 정보를 불러오는 중입니다.',
    ],
  ])('%s', (_, row, meId, reason) => {
    expect(resetBlockedReason(row, meId)).toBe(reason);
  });
});
