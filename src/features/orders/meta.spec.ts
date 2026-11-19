import {
  actorLabel,
  cancelFaultLabel,
  cancelReasonLabel,
  confirmSourceLabel,
  formatBps,
  paymentMethodLabel,
  paymentStatusMeta,
  refundKindLabel,
  refundStatusMeta,
} from './meta';

describe('order meta', () => {
  it.each([
    [actorLabel, ['BUYER', 'SELLER', 'ADMIN', 'SYSTEM'], ['구매자', '판매자', '관리자', '시스템']],
    [
      cancelReasonLabel,
      [
        'DESIGN_NOT_FEASIBLE',
        'OUT_OF_MATERIALS',
        'SCHEDULE_UNAVAILABLE',
        'INAPPROPRIATE_REQUEST',
        'BUYER_REQUEST',
        'OTHER',
        'PAYMENT_NOT_RECEIVED',
        'CONFIRM_TIMEOUT',
      ],
      [
        '제작할 수 없는 디자인',
        '재료 소진',
        '일정 불가',
        '부적절한 요청',
        '구매자 요청',
        '기타',
        '미입금',
        '판매자 미확정',
      ],
    ],
    [cancelFaultLabel, ['SELLER', 'BUYER'], ['판매자 사정', '구매자 사정']],
    [refundKindLabel, ['CANCEL', 'DEPOSIT_RETURN'], ['취소 환불', '입금 반환']],
    [paymentMethodLabel, ['BANK_TRANSFER', 'TOSS'], ['계좌이체', '토스']],
    [confirmSourceLabel, ['AUTO', 'ADMIN'], ['자동 매칭', '관리자 확인']],
  ] as const)(
    '라벨 표 %#는 SDL 값을 전부 바꾸고 모르는 값은 원문으로 둔다',
    (fn, values, labels) => {
      expect(values.map((v) => fn(v))).toEqual(labels);
      expect(fn('NEW_VALUE')).toBe('NEW_VALUE');
      expect(fn('constructor')).toBe('constructor');
    },
  );

  it.each([
    [refundStatusMeta, 'AWAITING_ACCOUNT', '계좌 입력 대기', 'caution'],
    [refundStatusMeta, 'AWAITING_TRANSFER', '송금 대기', 'primary'],
    [refundStatusMeta, 'COMPLETED', '송금 완료', 'positive'],
    [paymentStatusMeta, 'PENDING', '입금 대기', 'neutral'],
    [paymentStatusMeta, 'CONFIRMED', '입금 확인', 'positive'],
    [paymentStatusMeta, 'CANCELED', '입금 전 취소', 'negative'],
    [refundStatusMeta, 'toString', 'toString', 'neutral'],
    [paymentStatusMeta, 'REFUNDED', 'REFUNDED', 'neutral'],
  ] as const)('%#: %s는 %s(%s)', (fn, value, label, tone) => {
    expect(fn(value)).toEqual({ label, tone });
  });

  it.each([
    [0, '0%'],
    [1, '0.01%'],
    [50, '0.5%'],
    [555, '5.55%'],
    [1000, '10%'],
    [10000, '100%'],
  ])('수수료율 %ibp는 %s', (bps, text) => {
    expect(formatBps(bps)).toBe(text);
  });

  it('0~10000bp 전부 정수 문자열 연산 결과와 같다', () => {
    for (let bps = 0; bps <= 10000; bps += 1) {
      const frac = String(bps % 100)
        .padStart(2, '0')
        .replace(/0+$/, '');
      expect(formatBps(bps)).toBe(`${Math.floor(bps / 100)}${frac ? `.${frac}` : ''}%`);
    }
  });
});
