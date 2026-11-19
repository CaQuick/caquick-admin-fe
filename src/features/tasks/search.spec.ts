import {
  depositsSearchSchema,
  parseWon,
  refundsSearchSchema,
  settlementsSearchSchema,
  toDepositRecordInput,
  toPendingPaymentInput,
  toRefundListInput,
  toSettlementListInput,
} from './search';

describe('parseWon', () => {
  it.each([
    ['0', 0],
    ['12000', 12000],
    ['12,000', 12000],
    [' 5 ', 5],
    ['2147483647', 2147483647],
    ['2147483648', null],
    ['-1', null],
    ['1.5', null],
    ['1e3', null],
    ['', null],
    ['   ', null],
    ['abc', null],
  ])('"%s" → %s', (raw, want) => {
    expect(parseWon(raw)).toBe(want);
  });
});

describe('입금 탭 검색 파라미터', () => {
  it('금액 "0"과 주문 ID "0"을 버리지 않고 입력으로 보낸다', () => {
    const s = depositsSearchSchema.parse({ view: 'pending', amount: '0', orderId: '0' });
    expect(s.amount).toBe('0');
    expect(s.orderId).toBe('0');
    expect(toPendingPaymentInput(s)).toEqual({
      limit: 20,
      cursor: null,
      claimedOnly: false,
      amount: 0,
      depositorName: null,
    });
  });

  it('주소창이 숫자로 파싱한 금액도 문자열로 받는다', () => {
    expect(depositsSearchSchema.parse({ amount: 0 }).amount).toBe('0');
  });

  it.each(['-1', '1.5', 'abc', '2147483648'])('형식이 틀린 금액 "%s"는 필터 없음', (amount) => {
    expect(depositsSearchSchema.parse({ amount }).amount).toBeUndefined();
  });

  it('보기 기본값은 확인 요청(claimedOnly)이고 모르는 보기는 버린다', () => {
    const s = depositsSearchSchema.parse({ view: 'nope' });
    expect(s.view).toBeUndefined();
    expect(toPendingPaymentInput(s).claimedOnly).toBe(true);
  });

  it('입금자명은 앞뒤 공백을 빼고 50자(코드 포인트)로 자른다', () => {
    const long = '가'.repeat(49) + '😀' + '나';
    expect(depositsSearchSchema.parse({ depositorName: `  ${long} ` }).depositorName).toBe(
      '가'.repeat(49) + '😀',
    );
    expect(depositsSearchSchema.parse({ depositorName: '   ' }).depositorName).toBeUndefined();
  });

  it('입금 기록 입력은 종류만 넘긴다', () => {
    expect(toDepositRecordInput(depositsSearchSchema.parse({ kind: 'UNIDENTIFIED' }))).toEqual({
      limit: 20,
      cursor: null,
      kind: 'UNIDENTIFIED',
    });
    expect(depositsSearchSchema.parse({ kind: 'X' }).kind).toBeUndefined();
  });
});

describe('환불 탭 검색 파라미터', () => {
  it('상태 기본값은 송금 대기다', () => {
    expect(toRefundListInput(refundsSearchSchema.parse({}))).toEqual({
      limit: 20,
      cursor: null,
      status: 'AWAITING_TRANSFER',
      kind: null,
    });
  });

  it('완료 상태는 처리 대기 화면에서 고를 수 없다', () => {
    expect(refundsSearchSchema.parse({ status: 'COMPLETED' }).status).toBeUndefined();
  });

  it('계좌 입력 대기·종류·환불 ID를 받는다', () => {
    const s = refundsSearchSchema.parse({
      status: 'AWAITING_ACCOUNT',
      kind: 'DEPOSIT_RETURN',
      refundId: '0',
    });
    expect(s.refundId).toBe('0');
    expect(toRefundListInput(s)).toMatchObject({
      status: 'AWAITING_ACCOUNT',
      kind: 'DEPOSIT_RETURN',
    });
  });
});

describe('정산 송금 탭 검색 파라미터', () => {
  it('딥링크의 정산 기간 시작일로 송금 대기 정산만 거른다', () => {
    expect(
      toSettlementListInput(settlementsSearchSchema.parse({ periodStart: '2026-11-09' })),
    ).toEqual({
      limit: 20,
      cursor: null,
      status: 'PENDING',
      periodStart: '2026-11-09',
    });
  });

  it.each(['2026-02-30', '2026-11-9', 'abc'])('날짜가 아닌 "%s"는 필터 없음', (periodStart) => {
    expect(settlementsSearchSchema.parse({ periodStart }).periodStart).toBeUndefined();
  });
});
