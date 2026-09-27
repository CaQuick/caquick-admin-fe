import { hasOrderFilters, ordersSearchSchema, toOrderListInput } from './search';

describe('orders search', () => {
  it('빈 파라미터는 기본 limit 20·필터 없음', () => {
    const s = ordersSearchSchema.parse({});
    expect(toOrderListInput(s)).toEqual({
      limit: 20,
      cursor: null,
      keyword: null,
      status: null,
      storeId: null,
      accountId: null,
      fromCreatedAt: null,
      toCreatedAt: null,
    });
    expect(hasOrderFilters(s)).toBe(false);
  });

  it('날짜는 KST 하루 경계로, 잘못된 날짜는 무시, "0" ID는 유지', () => {
    const s = ordersSearchSchema.parse({
      q: '김서',
      status: 'CONFIRMED',
      storeId: '0',
      from: '2026-09-21',
      to: '2026-02-30',
      limit: '50',
      cursor: 'abc',
    });
    expect(toOrderListInput(s)).toMatchObject({
      limit: 50,
      cursor: 'abc',
      keyword: '김서',
      status: 'CONFIRMED',
      storeId: '0',
      fromCreatedAt: '2026-09-20T15:00:00.000Z',
      toCreatedAt: null,
    });
    expect(hasOrderFilters(s)).toBe(true);
  });

  it('이상한 값은 버린다(상태·limit 범위·빈 문자열)', () => {
    const s = ordersSearchSchema.parse({ status: 'NOPE', limit: '500', q: '', cursor: '' });
    expect(s.status).toBeUndefined();
    expect(s.limit).toBeUndefined();
    expect(s.q).toBeUndefined();
    expect(s.cursor).toBeUndefined();
  });
});
