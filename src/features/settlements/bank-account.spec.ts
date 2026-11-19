import { bankAccountSchema, toBankAccount } from './bank-account';

const valid = {
  bankCode: '004',
  accountNumber: '110-123-456789',
  accountHolder: ' 박사장 ',
  reason: ' 판매자 요청 ',
};

const errorOf = (over: Partial<typeof valid>) => {
  const r = bankAccountSchema.safeParse({ ...valid, ...over });
  return r.success ? null : r.error.issues[0]?.message;
};

describe('계좌 입력', () => {
  it('하이픈·공백을 빼고 숫자만, 예금주·사유는 앞뒤 공백 없이 보낸다', () => {
    expect(toBankAccount(bankAccountSchema.parse(valid))).toEqual({
      bankCode: '004',
      accountNumber: '110123456789',
      accountHolder: '박사장',
      reason: '판매자 요청',
    });
    expect(
      toBankAccount(bankAccountSchema.parse({ ...valid, accountNumber: ' 1101 2345 ' }))
        .accountNumber,
    ).toBe('11012345');
  });

  it.each([
    ['12345678', null],
    ['1'.repeat(20), null],
    ['1234567', '계좌번호는 하이픈을 뺀 숫자 8~20자리로 입력해 주세요.'],
    ['1'.repeat(21), '계좌번호는 하이픈을 뺀 숫자 8~20자리로 입력해 주세요.'],
    ['1234-567a', '계좌번호는 하이픈을 뺀 숫자 8~20자리로 입력해 주세요.'],
    ['', '계좌번호는 하이픈을 뺀 숫자 8~20자리로 입력해 주세요.'],
  ])('계좌번호 %s → %s', (accountNumber, message) => {
    expect(errorOf({ accountNumber })).toBe(message);
  });

  it.each([
    [{ bankCode: '' }, '은행을 선택해 주세요.'],
    [{ accountHolder: '   ' }, '예금주를 입력해 주세요.'],
    [{ accountHolder: '가'.repeat(51) }, '예금주는 50자 이하로 입력해 주세요.'],
    [{ accountHolder: '가'.repeat(50) }, null],
    [{ reason: '  ' }, '사유를 입력해 주세요.'],
    [{ reason: '가'.repeat(501) }, '사유는 500자 이하로 입력해 주세요.'],
    [{ reason: '가'.repeat(500) }, null],
  ])('%o → %s', (over, message) => {
    expect(errorOf(over)).toBe(message);
  });
});
