import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, graphql } from 'msw';
import { toast } from 'sonner';

import { App } from '@/app/app';
import { useAuthStore } from '@/features/auth';
import { gqlError, gqlOk, restOk } from '@/test/msw/graphql';
import { server } from '@/test/msw/server';

import { currentKstMonth } from '../search';

const me = {
  accountId: '1',
  username: 'ops.admin',
  email: null,
  name: null,
  status: 'ACTIVE',
  mustChangePassword: false,
  lastLoginAt: null,
  createdAt: '2026-09-27T00:00:00.000Z',
};
const summary = (over: Record<string, unknown> = {}) => ({
  id: '31',
  storeId: '17',
  storeName: '루미 케이크',
  periodStart: '2026-11-09',
  periodEnd: '2026-11-15',
  orderCount: 3,
  settlementBaseAmount: 100_000,
  commissionAmount: 5_550,
  payoutAmount: 94_450,
  status: 'PENDING',
  paidAt: null,
  accountRegistered: true,
  createdAt: '2026-11-16T20:00:00.000Z',
  ...over,
});
const kb = { code: '004', name: 'KB국민은행' };
const account = {
  storeId: '17',
  bank: kb,
  accountHolder: '박사장',
  accountNumber: '110123456789',
  accountNumberMasked: '****6789',
  updatedByRole: 'SELLER',
  updatedAt: '2026-11-10T01:00:00.000Z',
};
const detail = (over: Record<string, unknown> = {}) => ({
  ...summary(),
  paidByLabel: null,
  paidNote: null,
  paidAccount: null,
  currentAccount: account,
  orders: [
    {
      orderId: '101',
      orderNumber: 'CQ-101',
      productName: '레터링 케이크',
      status: 'PICKED_UP',
      commissionRateBps: 555,
      settlementBaseAmount: 100_000,
      commissionAmount: 5_550,
      payoutAmount: 94_450,
      settlementFinalizedAt: '2026-11-12T03:00:00.000Z',
    },
  ],
  ...over,
});
const paid = (by: string) =>
  detail({
    status: 'PAID',
    paidAt: '2026-11-17T01:00:00.000Z',
    paidByLabel: by,
    paidNote: '11/17 이체',
    paidAccount: { bank: kb, accountHolder: '박사장', accountNumberMasked: '****6789' },
  });

function boot(path: string) {
  server.use(
    restOk('/admin/refresh', {
      accessToken: 'at',
      tokenType: 'Bearer',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
    }),
    gqlOk('AdminMe', { adminMe: me }),
    gqlOk('AdminPaymentBanks', { paymentBanks: [kb, { code: '088', name: '신한은행' }] }),
    gqlOk('AdminSettlementStorePicker', {
      adminStores: {
        items: [
          { id: '17', storeName: '루미 케이크', isActive: true },
          { id: '18', storeName: '보리 베이커리', isActive: false },
        ],
      },
    }),
  );
  window.history.pushState({}, '', path);
  render(<App />);
}

const hrefOf = (name: string | RegExp) =>
  decodeURIComponent(screen.getByRole('link', { name }).getAttribute('href') ?? '');

describe('정산·결제 설정', () => {
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );
  afterEach(() => vi.restoreAllMocks());

  it('주간 정산 목록: 상태·정산 주 필터를 요청에 싣고 계좌 미등록을 표시한다', async () => {
    const inputs: Record<string, unknown>[] = [];
    server.use(
      graphql.query('AdminSettlements', ({ variables }) => {
        inputs.push((variables as { input: Record<string, unknown> }).input);
        return HttpResponse.json({
          data: {
            adminSettlements: {
              items: [
                summary(),
                summary({
                  id: '32',
                  storeId: '18',
                  storeName: '보리 베이커리',
                  accountRegistered: false,
                }),
                summary({
                  id: '33',
                  storeName: '송금 끝',
                  status: 'PAID',
                  paidAt: '2026-11-17T01:00:00.000Z',
                }),
              ],
              totalCount: 3,
              hasMore: true,
              nextCursor: 'next-1',
            },
          },
        });
      }),
    );
    boot('/settlements');
    expect(await screen.findByRole('heading', { level: 2, name: '주간 정산' })).toBeInTheDocument();
    const link = await screen.findAllByRole('link', { name: '2026-11-09 ~ 11-15' });
    expect(link[0]).toHaveAttribute('href', '/settlements/31');
    expect(screen.getByRole('link', { name: '보리 베이커리' })).toHaveAttribute(
      'href',
      '/stores/18',
    );
    expect(screen.getAllByText('94,450원')).toHaveLength(3);
    expect(screen.getByText('미등록')).toBeInTheDocument();
    expect(screen.getByText('11-17 10:00')).toBeInTheDocument();
    expect(hrefOf(/월 수수료/)).toBe('/settlements/monthly');
    expect(inputs.at(-1)).toMatchObject({ status: null, storeId: null, periodStart: null });

    await userEvent.click(screen.getByRole('combobox', { name: '송금 상태' }));
    await userEvent.click(await screen.findByRole('option', { name: '송금 대기' }));
    await vi.waitFor(() => expect(inputs.at(-1)).toMatchObject({ status: 'PENDING' }));

    // 일요일을 골라도 그 주 월요일로 찾는다
    fireEvent.change(screen.getByLabelText('정산 주에 속한 날짜'), {
      target: { value: '2026-11-15' },
    });
    await vi.waitFor(() =>
      expect(inputs.at(-1)).toMatchObject({ status: 'PENDING', periodStart: '2026-11-09' }),
    );
    expect(window.location.search).toContain('periodStart=2026-11-09');

    await userEvent.click(screen.getByRole('combobox', { name: /^매장/ }));
    await userEvent.click(await screen.findByRole('option', { name: /보리 베이커리.*#18 · 숨김/ }));
    await vi.waitFor(() => expect(inputs.at(-1)).toMatchObject({ storeId: '18' }));

    await userEvent.click(screen.getByRole('button', { name: /다음/ }));
    await vi.waitFor(() => expect(inputs.at(-1)).toMatchObject({ cursor: 'next-1' }));

    await userEvent.click(screen.getByRole('combobox', { name: '송금 상태' }));
    await userEvent.click(await screen.findByRole('option', { name: '전체' }));
    await vi.waitFor(() => expect(window.location.search).not.toContain('status'));

    await userEvent.click(screen.getByRole('button', { name: /초기화/ }));
    await vi.waitFor(() => expect(window.location.search).toBe(''));
  });

  it('주간 정산 목록: 조회 실패는 표 대신 이유를 보인다', async () => {
    server.use(
      gqlError('AdminSettlements', {
        message: '날짜 형식이 올바르지 않습니다.',
        code: 'INVALID_DATE',
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
    );
    boot('/settlements?periodStart=2026-11-09');
    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent(
      '날짜 형식이 올바르지 않습니다.',
    );
  });

  it('상세: 송금할 계좌 전체와 확인 문구로 송금 완료하고 처리자·송금 계좌를 보인다', async () => {
    let state = detail();
    let markInput: unknown;
    server.use(
      graphql.query('AdminSettlement', () =>
        HttpResponse.json({ data: { adminSettlement: state } }),
      ),
      graphql.mutation('AdminMarkSettlementPaid', ({ variables }) => {
        markInput = (variables as { input: unknown }).input;
        state = paid('운영자(ops.admin)');
        return HttpResponse.json({
          data: { adminMarkSettlementPaid: { id: '31', status: 'PAID' } },
        });
      }),
    );
    boot('/settlements/31');
    expect(
      await screen.findByRole('heading', { level: 2, name: '루미 케이크 정산' }),
    ).toBeInTheDocument();
    expect(screen.getByText('110123456789')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '계좌번호 복사' })).toBeInTheDocument();
    expect(screen.getByText(/^판매자 · /)).toBeInTheDocument();
    expect(screen.getByText('5.55%')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'CQ-101' })).toHaveAttribute('href', '/orders/101');
    expect(hrefOf(/감사 이력/)).toBe('/audit-logs?targetType=SETTLEMENT&targetId=31');

    await userEvent.click(screen.getByRole('button', { name: '송금 완료' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('KB국민은행 110123456789(박사장)로 94,450원을 송금했나요?');
    await userEvent.type(within(dialog).getByLabelText('송금 메모 (선택)'), ' 11/17 이체 ');
    await userEvent.click(within(dialog).getByRole('button', { name: '송금 완료' }));
    await vi.waitFor(() => expect(markInput).toEqual({ settlementId: '31', note: '11/17 이체' }));
    expect(await screen.findByText('운영자(ops.admin)')).toBeInTheDocument();
    expect(screen.getByText('KB국민은행 ****6789(박사장)')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '송금 완료' })).not.toBeInTheDocument();
  });

  it('상세: 정산 계좌가 없으면 송금 완료를 누를 수 없고 매장으로 잇는다', async () => {
    server.use(
      gqlOk('AdminSettlement', {
        adminSettlement: detail({ accountRegistered: false, currentAccount: null }),
      }),
    );
    boot('/settlements/31');
    expect(await screen.findByRole('button', { name: '송금 완료' })).toBeDisabled();
    expect(screen.getByText(/매장 정산 계좌가 없어/)).toBeInTheDocument();
    expect(hrefOf('매장에서 계좌 등록')).toBe('/stores/17');
  });

  it('상세: 다른 관리자가 먼저 처리했으면(409) 알리고 다시 받아 처리자를 보인다', async () => {
    const error = vi.spyOn(toast, 'error');
    let state = detail();
    server.use(
      graphql.query('AdminSettlement', () =>
        HttpResponse.json({ data: { adminSettlement: state } }),
      ),
      graphql.mutation('AdminMarkSettlementPaid', () => {
        state = paid('다른 관리자');
        return HttpResponse.json({
          data: null,
          errors: [
            {
              message: '이미 송금 완료된 정산입니다.',
              extensions: {
                code: 'SETTLEMENT_ALREADY_PAID',
                classification: 'CONFLICT',
                statusCode: 409,
              },
            },
          ],
        });
      }),
    );
    boot('/settlements/31');
    await userEvent.click(await screen.findByRole('button', { name: '송금 완료' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: '송금 완료' }));
    await vi.waitFor(() => expect(error).toHaveBeenCalledWith('이미 송금 완료된 정산입니다.'));
    expect(await screen.findByText('다른 관리자')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('상세: 그 밖의 오류는 알리고 다이얼로그를 열어 둔다', async () => {
    const error = vi.spyOn(toast, 'error');
    server.use(
      gqlOk('AdminSettlement', {
        adminSettlement: detail({
          orders: [{ ...detail().orders[0], productName: null }],
        }),
      }),
      gqlError('AdminMarkSettlementPaid', {
        message: '정산 계좌가 필요합니다.',
        code: 'SETTLEMENT_ACCOUNT_REQUIRED',
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
    );
    boot('/settlements/31');
    await userEvent.click(await screen.findByRole('button', { name: '송금 완료' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: '송금 완료' }));
    await vi.waitFor(() => expect(error).toHaveBeenCalledWith('정산 계좌가 필요합니다.'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('상세: 처리자 이름·메모·송금 계좌가 없는 송금 완료 기록은 빈 칸으로 보인다', async () => {
    server.use(
      gqlOk('AdminSettlement', {
        adminSettlement: detail({ status: 'PAID', paidAt: null, currentAccount: null }),
      }),
    );
    boot('/settlements/31');
    expect(await screen.findByText('처리자')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(4);
    expect(screen.queryByRole('button', { name: '송금 완료' })).not.toBeInTheDocument();
  });

  it('상세: 없는 정산은 오류와 목록 링크', async () => {
    server.use(
      gqlError('AdminSettlement', {
        message: '정산을 찾을 수 없습니다.',
        code: 'SETTLEMENT_NOT_FOUND',
        classification: 'NOT_FOUND',
        statusCode: 404,
      }),
    );
    boot('/settlements/999');
    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent(
      '정산을 찾을 수 없습니다.',
    );
    expect(screen.getByRole('link', { name: '목록으로' })).toBeInTheDocument();
  });

  it('월 수수료: 월 합계와 매장별 표, 이전·다음 달로 옮긴다', async () => {
    const months: string[] = [];
    server.use(
      graphql.query('AdminMonthlyCommissions', ({ variables }) => {
        const { month } = (variables as { input: { month: string } }).input;
        months.push(month);
        return HttpResponse.json({
          data: {
            adminMonthlyCommissions:
              month === '2026-11'
                ? {
                    month,
                    orderCount: 12,
                    settlementBaseAmount: 1_000_000,
                    commissionAmount: 55_500,
                    stores: [
                      {
                        storeId: '17',
                        storeName: '루미 케이크',
                        orderCount: 12,
                        settlementBaseAmount: 1_000_000,
                        commissionAmount: 55_500,
                      },
                    ],
                  }
                : {
                    month,
                    orderCount: 0,
                    settlementBaseAmount: 0,
                    commissionAmount: 0,
                    stores: [],
                  },
          },
        });
      }),
    );
    boot('/settlements/monthly?month=2026-11');
    expect(await screen.findByRole('link', { name: '루미 케이크' })).toHaveAttribute(
      'href',
      '/stores/17',
    );
    expect(screen.getAllByText('12건')).toHaveLength(2);
    expect(screen.getAllByText('55,500원')).toHaveLength(2);
    expect(screen.getByLabelText('집계 월')).toHaveValue('2026-11');

    await userEvent.click(screen.getByRole('button', { name: '이전 달' }));
    expect(await screen.findByText('이 달에 정산이 확정된 주문이 없습니다.')).toBeInTheDocument();
    expect(window.location.search).toBe('?month=2026-10');
    expect(months).toEqual(['2026-11', '2026-10']);
  });

  it('월 수수료: 월을 직접 고르고 다음 달로 옮기며, 실패하면 이유를 보인다', async () => {
    const months: string[] = [];
    server.use(
      graphql.query('AdminMonthlyCommissions', ({ variables }) => {
        months.push((variables as { input: { month: string } }).input.month);
        return HttpResponse.json({
          data: null,
          errors: [
            {
              message: '월 형식이 올바르지 않습니다.',
              extensions: {
                code: 'INVALID_YEAR_MONTH',
                classification: 'BAD_USER_INPUT',
                statusCode: 400,
              },
            },
          ],
        });
      }),
    );
    boot('/settlements/monthly?month=2026-11');
    expect(await screen.findByRole('alert')).toHaveTextContent('월 형식이 올바르지 않습니다.');
    fireEvent.change(screen.getByLabelText('집계 월'), { target: { value: '2025-12' } });
    await vi.waitFor(() => expect(window.location.search).toBe('?month=2025-12'));
    // 지운 값은 무시한다
    fireEvent.change(screen.getByLabelText('집계 월'), { target: { value: '' } });
    await userEvent.click(screen.getByRole('button', { name: '다음 달' }));
    await vi.waitFor(() => expect(window.location.search).toBe('?month=2026-01'));
    // 실패는 한 번 재시도하므로 같은 달이 두 번 올 수 있다
    expect([...new Set(months)]).toEqual(['2026-11', '2025-12', '2026-01']);
  });

  it('월 수수료: 월 입력이 글자 칸인 브라우저에서도 다 친 월만 옮기고, 치다 만 값은 칸을 떠나면 되돌린다', async () => {
    const months: string[] = [];
    server.use(
      graphql.query('AdminMonthlyCommissions', ({ variables }) => {
        const { month } = (variables as { input: { month: string } }).input;
        months.push(month);
        return HttpResponse.json({
          data: {
            adminMonthlyCommissions: {
              month,
              orderCount: 0,
              settlementBaseAmount: 0,
              commissionAmount: 0,
              stores: [],
            },
          },
        });
      }),
    );
    boot('/settlements/monthly?month=2026-11');
    const input = await screen.findByLabelText('집계 월');
    // Safari·Firefox는 month 입력을 글자 칸으로 그린다. React가 렌더마다 type을 다시 써도 글자 칸으로 둔다
    Object.defineProperty(input, 'type', { get: () => 'text', set: () => undefined });
    input.setAttribute('type', 'text');
    await userEvent.clear(input);
    await userEvent.type(input, '2025-0');
    expect(input).toHaveValue('2025-0');
    expect(window.location.search).toBe('?month=2026-11');
    await userEvent.type(input, '3');
    await vi.waitFor(() => expect(window.location.search).toBe('?month=2025-03'));

    await userEvent.clear(input);
    await userEvent.type(input, '2024');
    await userEvent.tab();
    expect(input).toHaveValue('2025-03');
    expect(window.location.search).toBe('?month=2025-03');
    await userEvent.click(screen.getByRole('button', { name: '다음 달' }));
    await vi.waitFor(() => expect(input).toHaveValue('2025-04'));
    expect([...new Set(months)]).toEqual(['2026-11', '2025-03', '2025-04']);
  });

  it('월 수수료: 월이 없으면 이번 달(KST)을 집계한다', async () => {
    const months: string[] = [];
    server.use(
      graphql.query('AdminMonthlyCommissions', ({ variables }) => {
        const { month } = (variables as { input: { month: string } }).input;
        months.push(month);
        return HttpResponse.json({
          data: {
            adminMonthlyCommissions: {
              month,
              orderCount: 0,
              settlementBaseAmount: 0,
              commissionAmount: 0,
              stores: [],
            },
          },
        });
      }),
    );
    boot('/settlements/monthly');
    await screen.findByText('이 달에 정산이 확정된 주문이 없습니다.');
    expect(months).toEqual([currentKstMonth()]);
  });

  it('결제 설정: 수수료율은 퍼센트를 bp로 바꿔 보내고, 입금 계좌가 없으면 주문을 받을 수 없다고 알린다', async () => {
    const inputs: Record<string, unknown>[] = [];
    let setting: Record<string, unknown> = {
      commissionRateBps: 555,
      depositBank: null,
      depositAccountNumber: null,
      depositAccountHolder: null,
      updatedAt: null,
    };
    server.use(
      graphql.query('AdminPaymentSetting', () =>
        HttpResponse.json({ data: { adminPaymentSetting: setting } }),
      ),
      graphql.mutation('AdminUpdatePaymentSetting', ({ variables }) => {
        const input = (variables as { input: Record<string, unknown> }).input;
        inputs.push(input);
        setting = {
          ...setting,
          ...(input.commissionRateBps != null && { commissionRateBps: input.commissionRateBps }),
          ...(input.depositBankCode != null && {
            depositBank: kb,
            depositAccountNumber: input.depositAccountNumber,
            depositAccountHolder: input.depositAccountHolder,
          }),
          updatedAt: '2026-11-19T01:00:00.000Z',
        };
        return HttpResponse.json({
          data: { adminUpdatePaymentSetting: { updatedAt: setting.updatedAt } },
        });
      }),
    );
    boot('/settings');
    expect(await screen.findByText('5.55%')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      '입금 계좌가 없어 주문을 받을 수 없습니다.',
    );
    expect(screen.getByText(/변경 이후 생성되는 주문부터 적용됩니다/)).toBeInTheDocument();
    expect(hrefOf(/감사 이력/)).toBe('/audit-logs?targetType=PAYMENT_SETTING');

    await userEvent.click(screen.getByRole('button', { name: '변경' }));
    let dialog = await screen.findByRole('dialog');
    const rate = within(dialog).getByLabelText('수수료율 (%)');
    expect(rate).toHaveValue('5.55');
    await userEvent.clear(rate);
    await userEvent.type(rate, '5.555');
    await userEvent.click(within(dialog).getByRole('button', { name: '저장' }));
    expect(
      await within(dialog).findByText('0~100 사이 숫자를 소수 둘째 자리까지 입력해 주세요.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('사유를 입력해 주세요.')).toBeInTheDocument();
    await userEvent.clear(rate);
    await userEvent.type(rate, '7.5');
    await userEvent.type(within(dialog).getByLabelText('변경 사유 (필수)'), '정책 변경');
    await userEvent.click(within(dialog).getByRole('button', { name: '저장' }));
    await vi.waitFor(() =>
      expect(inputs).toEqual([{ commissionRateBps: 750, reason: '정책 변경' }]),
    );
    expect(await screen.findByText('7.5%')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '등록' }));
    dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('combobox', { name: '은행' }));
    await userEvent.click(await screen.findByRole('option', { name: 'KB국민은행' }));
    await userEvent.type(within(dialog).getByLabelText('계좌번호'), '110-123-456789');
    await userEvent.type(within(dialog).getByLabelText('예금주'), '(주)케이퀵');
    await userEvent.type(within(dialog).getByLabelText('변경 사유 (필수)'), '계좌 개설');
    await userEvent.click(within(dialog).getByRole('button', { name: '저장' }));
    await vi.waitFor(() =>
      expect(inputs.at(-1)).toEqual({
        depositBankCode: '004',
        depositAccountNumber: '110123456789',
        depositAccountHolder: '(주)케이퀵',
        reason: '계좌 개설',
      }),
    );
    expect(await screen.findByText('110123456789')).toBeInTheDocument();
    expect(screen.queryByText('입금 계좌가 없어 주문을 받을 수 없습니다.')).not.toBeInTheDocument();
  });

  it('결제 설정: 조회 실패는 이유를 보인다', async () => {
    server.use(
      gqlError('AdminPaymentSetting', {
        message: '권한이 없습니다.',
        code: 'FORBIDDEN',
        classification: 'FORBIDDEN',
        statusCode: 403,
      }),
    );
    boot('/settings');
    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent(
      '권한이 없습니다.',
    );
  });

  it('결제 설정: 서버가 거절하면 다이얼로그 위에 이유를 보이고 열어 둔다', async () => {
    server.use(
      gqlOk('AdminPaymentSetting', {
        adminPaymentSetting: {
          commissionRateBps: 0,
          depositBank: kb,
          depositAccountNumber: '110123456789',
          depositAccountHolder: '케이퀵',
          updatedAt: '2026-11-01T00:00:00.000Z',
        },
      }),
      gqlError('AdminUpdatePaymentSetting', {
        message: '지원하지 않는 은행입니다.',
        code: 'INVALID_BANK_CODE',
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
    );
    boot('/settings');
    expect(await screen.findByText('0%')).toBeInTheDocument();
    const [, accountButton] = screen.getAllByRole('button', { name: '변경' });
    await userEvent.click(accountButton!);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText('계좌번호')).toHaveValue('110123456789');
    expect(within(dialog).getByLabelText('예금주')).toHaveValue('케이퀵');
    await userEvent.type(within(dialog).getByLabelText('변경 사유 (필수)'), '확인');
    await userEvent.click(within(dialog).getByRole('button', { name: '저장' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('지원하지 않는 은행입니다.');
    await userEvent.click(within(dialog).getAllByRole('button', { name: '닫기' })[0]!);
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    const [rateButton] = screen.getAllByRole('button', { name: '변경' });
    await userEvent.click(rateButton!);
    const rateDialog = await screen.findByRole('dialog');
    await userEvent.type(within(rateDialog).getByLabelText('변경 사유 (필수)'), '확인');
    await userEvent.click(within(rateDialog).getByRole('button', { name: '저장' }));
    expect(await within(rateDialog).findByRole('alert')).toHaveTextContent(
      '지원하지 않는 은행입니다.',
    );
    await userEvent.click(within(rateDialog).getAllByRole('button', { name: '닫기' })[0]!);
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
