import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, graphql } from 'msw';

import { App } from '@/app/app';
import { useAuthStore } from '@/features/auth';
import { forgetSearches } from '@/shared/lib/list-return';
import { formatKst } from '@/shared/lib/kst';
import { gqlError, gqlOk, restOk } from '@/test/msw/graphql';
import { server } from '@/test/msw/server';

import {
  type RefundDetail,
  type RefundRow,
  type SettlementDetail,
  type SettlementRow,
} from '../api/queries';

const me = {
  accountId: '1',
  username: 'ops.admin',
  email: null,
  name: '운영',
  status: 'ACTIVE',
  mustChangePassword: false,
  lastLoginAt: null,
  createdAt: '2026-09-27T00:00:00.000Z',
};

function boot(path: string) {
  server.use(
    restOk('/admin/refresh', {
      accessToken: 'at',
      tokenType: 'Bearer',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
    }),
    gqlOk('AdminMe', { adminMe: me }),
  );
  window.history.pushState({}, '', path);
  render(<App />);
}

const query = () => new URLSearchParams(window.location.search);
const bank = { code: '004', name: 'KB국민은행' };

const refund = (
  id: string,
  over: Partial<RefundDetail['refund']> = {},
): RefundDetail['refund'] => ({
  id,
  kind: 'CANCEL',
  amount: 30000,
  status: 'AWAITING_TRANSFER',
  bank,
  accountHolder: '김구매',
  accountNumberMasked: '****5678',
  requestedAt: '2026-11-18T03:00:00.000Z',
  accountSubmittedAt: '2026-11-18T04:00:00.000Z',
  completedAt: null,
  orderId: `9${id}`,
  orderNumber: `CQ-9${id}`,
  buyerName: '김구매',
  buyerPhone: '010-1234-5678',
  storeName: '루미 케이크',
  productName: '레터링 케이크',
  completedByLabel: null,
  completeNote: null,
  ...over,
});
const toRow = ({
  completedAt: _c,
  completedByLabel: _l,
  completeNote: _n,
  ...r
}: RefundDetail['refund']): RefundRow => r;

/** 환불을 들고 있는 가짜 BE. 송금 완료하면 송금 대기 목록에서 빠진다 */
function refundBackend(initial: RefundDetail['refund'][]) {
  const refunds = new Map(initial.map((r) => [r.id, r]));
  const inputs: Record<string, unknown>[] = [];
  server.use(
    graphql.query('AdminTasksRefunds', ({ variables }) => {
      const input = (variables as { input: Record<string, unknown> }).input;
      inputs.push(input);
      const items = [...refunds.values()]
        .filter((r) => r.status === input.status)
        .filter((r) => !input.kind || r.kind === input.kind)
        .map(toRow);
      return HttpResponse.json({
        data: {
          adminRefunds: { items, totalCount: items.length, hasMore: false, nextCursor: null },
        },
      });
    }),
    graphql.query('AdminTasksRefund', ({ variables }) => {
      const r = refunds.get((variables as { refundId: string }).refundId)!;
      return HttpResponse.json({
        data: {
          adminRefund: {
            refund: r,
            accountNumber: r.bank ? '12345678' : null,
            depositRecord:
              r.kind === 'DEPOSIT_RETURN'
                ? { id: '31', depositorName: '김입금', depositedAt: null, note: '늦은 입금' }
                : null,
          },
        },
      });
    }),
  );
  return { refunds, inputs };
}

describe('처리 대기 — 환불', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false });
    forgetSearches();
  });

  it('딥링크 환불을 시트로 열어 전체 계좌를 복사하고 송금 완료 뒤 다음 건으로 간다', async () => {
    const { refunds } = refundBackend([refund('5'), refund('6')]);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    let completeInput: unknown;
    server.use(
      graphql.mutation('AdminTasksCompleteRefund', ({ variables }) => {
        completeInput = (variables as { input: unknown }).input;
        refunds.set('5', {
          ...refunds.get('5')!,
          status: 'COMPLETED',
          completedAt: '2026-11-19T01:00:00.000Z',
          completedByLabel: '운영(ops.admin)',
          completeNote: '국민 이체',
        });
        return HttpResponse.json({
          data: { adminCompleteRefund: { id: '5', status: 'COMPLETED' } },
        });
      }),
    );
    boot('/tasks/refunds?refundId=5');
    const s = await screen.findByRole('dialog', { name: /취소 환불 30,000원/ });
    expect(s).toHaveTextContent('KB국민은행 12345678 (김구매)');
    expect(within(s).getByRole('link', { name: 'CQ-95' })).toHaveAttribute('href', '/orders/95');
    // 목록은 끝 4자리만 보인다
    expect(screen.getAllByText('KB국민은행 ****5678 (김구매)')).toHaveLength(2);

    await userEvent.click(within(s).getByRole('button', { name: '계좌번호 복사' }));
    expect(writeText).toHaveBeenCalledWith('12345678');
    expect(await screen.findByText('계좌번호를 복사했습니다.')).toBeInTheDocument();

    await userEvent.click(within(s).getByRole('button', { name: '송금 완료' }));
    const dialog = await screen.findByRole('dialog', { name: '송금 완료로 처리할까요?' });
    expect(dialog).toHaveTextContent('KB국민은행 12345678(김구매)로 30,000원을 송금했나요?');
    await userEvent.type(within(dialog).getByLabelText('메모 (선택)'), '국민 이체');
    await userEvent.click(within(dialog).getByRole('button', { name: '송금 완료' }));
    await vi.waitFor(() => expect(completeInput).toEqual({ refundId: '5', note: '국민 이체' }));
    expect(await within(s).findByRole('status')).toHaveTextContent(
      `송금 완료 · 운영(ops.admin) · ${formatKst('2026-11-19T01:00:00.000Z', true)} · 국민 이체`,
    );
    await userEvent.click(within(s).getByRole('button', { name: '다음 건 (1건 남음)' }));
    await vi.waitFor(() => expect(query().get('refundId')).toBe('6'));
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('이미 송금이 끝났으면(409) 토스트를 보이고 처리자·시각을 다시 읽어 보인다', async () => {
    const { refunds } = refundBackend([refund('5')]);
    server.use(
      graphql.mutation('AdminTasksCompleteRefund', () => {
        refunds.set('5', {
          ...refunds.get('5')!,
          status: 'COMPLETED',
          completedAt: '2026-11-19T00:30:00.000Z',
          completedByLabel: null,
        });
        return HttpResponse.json({
          data: null,
          errors: [
            {
              message: '이미 송금이 끝난 환불입니다.',
              extensions: {
                code: 'REFUND_ALREADY_COMPLETED',
                classification: 'CONFLICT',
                statusCode: 409,
              },
            },
          ],
        });
      }),
    );
    boot('/tasks/refunds?refundId=5');
    const s = await screen.findByRole('dialog', { name: /취소 환불/ });
    await userEvent.click(within(s).getByRole('button', { name: '송금 완료' }));
    const dialog = await screen.findByRole('dialog', { name: '송금 완료로 처리할까요?' });
    await userEvent.click(within(dialog).getByRole('button', { name: '송금 완료' }));
    expect(await screen.findByText('이미 송금이 끝난 환불입니다.')).toBeInTheDocument();
    expect(await within(s).findByRole('status')).toHaveTextContent(
      `송금 완료 · 관리자 · ${formatKst('2026-11-19T00:30:00.000Z', true)}`,
    );
    expect(within(s).getByText('남은 건이 없습니다.')).toBeInTheDocument();
  });

  it('송금 완료가 입력 오류로 거절되면 확인 창을 열어 둔다', async () => {
    refundBackend([refund('5')]);
    server.use(
      gqlError('AdminTasksCompleteRefund', {
        message: '환불 계좌가 입력되지 않아 송금 완료로 처리할 수 없어요.',
        code: 'REFUND_NOT_READY',
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
    );
    boot('/tasks/refunds?refundId=5');
    const s = await screen.findByRole('dialog', { name: /취소 환불/ });
    await userEvent.click(within(s).getByRole('button', { name: '송금 완료' }));
    const dialog = await screen.findByRole('dialog', { name: '송금 완료로 처리할까요?' });
    await userEvent.click(within(dialog).getByRole('button', { name: '송금 완료' }));
    expect(
      await screen.findByText('환불 계좌가 입력되지 않아 송금 완료로 처리할 수 없어요.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: '송금 완료로 처리할까요?' })).toBeInTheDocument();
  });

  it('복사에 실패하면 직접 옮겨 적으라고 알리고, 행을 눌러 열고 다음 페이지·초기화를 보낸다', async () => {
    const { inputs } = refundBackend([refund('5')]);
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    Object.defineProperty(document, 'execCommand', { value: () => false, configurable: true });
    server.use(
      graphql.query('AdminTasksRefunds', ({ variables }) => {
        const input = (variables as { input: Record<string, unknown> }).input;
        inputs.push(input);
        return HttpResponse.json({
          data: {
            adminRefunds: {
              items: [toRow(refund('5'))],
              totalCount: 2,
              hasMore: !input.cursor,
              nextCursor: input.cursor ? null : 'f2',
            },
          },
        });
      }),
    );
    boot('/tasks/refunds?kind=CANCEL');
    await userEvent.click(await screen.findByRole('row', { name: /CQ-95/ }));
    const s = await screen.findByRole('dialog', { name: /취소 환불/ });
    await userEvent.click(within(s).getByRole('button', { name: '계좌번호 복사' }));
    expect(
      await screen.findByText('복사하지 못했습니다. 계좌번호를 직접 옮겨 적어 주세요.'),
    ).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(query().get('refundId')).toBeNull());

    await userEvent.click(screen.getByRole('button', { name: /다음/ }));
    await vi.waitFor(() => expect(inputs.at(-1)).toMatchObject({ cursor: 'f2', kind: 'CANCEL' }));
    await userEvent.click(screen.getByRole('button', { name: '초기화' }));
    await vi.waitFor(() => expect(inputs.at(-1)).toMatchObject({ cursor: null, kind: null }));
    Reflect.deleteProperty(navigator, 'clipboard');
    Reflect.deleteProperty(document, 'execCommand');
  });

  it('목록을 읽지 못하면 이유를 보인다', async () => {
    server.use(
      gqlError('AdminTasksRefunds', {
        message: '환불 목록 오류',
        code: 'X',
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
    );
    boot('/tasks/refunds');
    expect(await screen.findByRole('alert')).toHaveTextContent('환불 목록 오류');
  });

  it('계좌 입력 대기는 연락처를 보이고 송금 완료를 막으며, 종류 칩을 입력으로 보낸다', async () => {
    const waiting = refund('7', {
      kind: 'DEPOSIT_RETURN',
      status: 'AWAITING_ACCOUNT',
      bank: null,
      accountHolder: null,
      accountNumberMasked: null,
      accountSubmittedAt: null,
    });
    const { inputs } = refundBackend([waiting, refund('8')]);
    boot('/tasks/refunds?status=AWAITING_ACCOUNT');
    const row = await screen.findByRole('row', { name: /CQ-97/ });
    expect(row).toHaveTextContent('김구매 · 010-1234-5678');
    expect(row).toHaveTextContent('입금 반환');
    expect(inputs.at(-1)).toEqual({
      limit: 20,
      cursor: null,
      status: 'AWAITING_ACCOUNT',
      kind: null,
    });

    await userEvent.click(within(row).getByRole('button', { name: 'CQ-97' }));
    const s = await screen.findByRole('dialog', { name: /입금 반환/ });
    expect(s).toHaveTextContent('구매자가 아직 입력하지 않았습니다.');
    expect(s).toHaveTextContent('김입금');
    expect(s).toHaveTextContent('늦은 입금');
    expect(within(s).getByRole('button', { name: '송금 완료' })).toBeDisabled();
    expect(s).toHaveTextContent('계좌 입력 전이라 송금할 수 없어요.');
    await userEvent.keyboard('{Escape}');

    await userEvent.click(screen.getByRole('button', { name: '입금 반환' }));
    await vi.waitFor(() =>
      expect(inputs.at(-1)).toMatchObject({ status: 'AWAITING_ACCOUNT', kind: 'DEPOSIT_RETURN' }),
    );
    expect(screen.getByRole('button', { name: '입금 반환' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(screen.getByRole('tab', { name: '송금 대기 0' }));
    await vi.waitFor(() =>
      expect(inputs.at(-1)).toMatchObject({ status: 'AWAITING_TRANSFER', kind: 'DEPOSIT_RETURN' }),
    );
  });
});

const settlement = (id: string, over: Partial<SettlementDetail> = {}): SettlementDetail => ({
  id,
  storeId: `5${id}`,
  storeName: `매장 ${id}`,
  periodStart: '2026-11-09',
  periodEnd: '2026-11-15',
  orderCount: 3,
  settlementBaseAmount: 90000,
  commissionAmount: 9000,
  payoutAmount: 81000,
  status: 'PENDING',
  paidAt: null,
  accountRegistered: true,
  paidByLabel: null,
  paidNote: null,
  paidAccount: null,
  currentAccount: { bank, accountHolder: '루미 대표', accountNumber: '99887766' },
  ...over,
});
const toSettlementRow = (s: SettlementDetail): SettlementRow => ({
  id: s.id,
  storeId: s.storeId,
  storeName: s.storeName,
  periodStart: s.periodStart,
  periodEnd: s.periodEnd,
  orderCount: s.orderCount,
  settlementBaseAmount: s.settlementBaseAmount,
  commissionAmount: s.commissionAmount,
  payoutAmount: s.payoutAmount,
  status: s.status,
  accountRegistered: s.accountRegistered,
  createdAt: '2026-11-16T20:00:00.000Z',
});

function settlementBackend(initial: SettlementDetail[]) {
  const settlements = new Map(initial.map((s) => [s.id, s]));
  const inputs: Record<string, unknown>[] = [];
  server.use(
    graphql.query('AdminTasksSettlements', ({ variables }) => {
      inputs.push((variables as { input: Record<string, unknown> }).input);
      const items = [...settlements.values()]
        .filter((s) => s.status === 'PENDING')
        .map(toSettlementRow);
      return HttpResponse.json({
        data: {
          adminSettlements: { items, totalCount: items.length, hasMore: false, nextCursor: null },
        },
      });
    }),
    graphql.query('AdminTasksSettlement', ({ variables }) =>
      HttpResponse.json({
        data: {
          adminSettlement: settlements.get((variables as { settlementId: string }).settlementId),
        },
      }),
    ),
  );
  return { settlements, inputs };
}

describe('처리 대기 — 정산 송금', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false });
    forgetSearches();
  });

  it('경보 딥링크의 기간으로 거르고, 계좌 없는 정산은 비활성 + 매장 링크다', async () => {
    const { inputs } = settlementBackend([
      settlement('1'),
      settlement('2', { accountRegistered: false, currentAccount: null }),
    ]);
    boot('/tasks/settlements?periodStart=2026-11-09');
    const noAccount = await screen.findByRole('row', { name: /매장 2/ });
    expect(inputs.at(-1)).toEqual({
      limit: 20,
      cursor: null,
      status: 'PENDING',
      periodStart: '2026-11-09',
    });
    expect(screen.getByLabelText('정산 기간 시작(월요일)')).toHaveValue('2026-11-09');
    expect(within(noAccount).getByRole('button', { name: '송금 처리' })).toBeDisabled();
    expect(
      within(noAccount).getByRole('link', { name: '매장에서 정산 계좌 등록' }),
    ).toHaveAttribute('href', '/stores/52');
    const ok = screen.getByRole('row', { name: /매장 1/ });
    expect(within(ok).getByRole('button', { name: '송금 처리' })).toBeEnabled();

    await userEvent.click(noAccount);
    const s = await screen.findByRole('dialog', { name: /매장 2 정산/ });
    expect(within(s).getByRole('button', { name: '송금 완료' })).toBeDisabled();
    expect(s).toHaveTextContent('정산 계좌가 없어 송금 완료로 처리할 수 없어요.');
    await userEvent.keyboard('{Escape}');

    await userEvent.click(screen.getByRole('button', { name: '초기화' }));
    await vi.waitFor(() => expect(inputs.at(-1)).toMatchObject({ periodStart: null }));
  });

  it('기간을 고르면 그 날짜로, 다음 페이지는 커서로 다시 읽는다', async () => {
    const inputs: Record<string, unknown>[] = [];
    server.use(
      graphql.query('AdminTasksSettlements', ({ variables }) => {
        const input = (variables as { input: Record<string, unknown> }).input;
        inputs.push(input);
        return HttpResponse.json({
          data: {
            adminSettlements: {
              items: [toSettlementRow(settlement('1'))],
              totalCount: 2,
              hasMore: !input.cursor,
              nextCursor: input.cursor ? null : 's2',
            },
          },
        });
      }),
    );
    boot('/tasks/settlements');
    await screen.findByRole('row', { name: /매장 1/ });
    await userEvent.click(screen.getByRole('button', { name: /다음/ }));
    await vi.waitFor(() => expect(inputs.at(-1)).toMatchObject({ cursor: 's2' }));
    await userEvent.type(screen.getByLabelText('정산 기간 시작(월요일)'), '2026-11-16');
    await vi.waitFor(() =>
      expect(inputs.at(-1)).toMatchObject({ cursor: null, periodStart: '2026-11-16' }),
    );
  });

  it('목록을 읽지 못하면 이유를 보인다', async () => {
    server.use(
      gqlError('AdminTasksSettlements', {
        message: '정산 목록 오류',
        code: 'X',
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
    );
    boot('/tasks/settlements');
    expect(await screen.findByRole('alert')).toHaveTextContent('정산 목록 오류');
  });

  it('송금 완료 뒤 계좌가 있는 다음 정산으로 넘어간다', async () => {
    const { settlements } = settlementBackend([
      settlement('1'),
      settlement('2', { accountRegistered: false, currentAccount: null }),
      settlement('3'),
    ]);
    let input: unknown;
    server.use(
      graphql.mutation('AdminTasksMarkSettlementPaid', ({ variables }) => {
        input = (variables as { input: unknown }).input;
        settlements.set('1', {
          ...settlements.get('1')!,
          status: 'PAID',
          paidAt: '2026-11-19T01:00:00.000Z',
          paidByLabel: '운영(ops.admin)',
          paidAccount: { bank, accountHolder: '루미 대표', accountNumberMasked: '****7766' },
        });
        return HttpResponse.json({
          data: { adminMarkSettlementPaid: { id: '1', status: 'PAID' } },
        });
      }),
    );
    boot('/tasks/settlements');
    const row = await screen.findByRole('row', { name: /매장 1/ });
    await userEvent.click(within(row).getByRole('button', { name: '송금 처리' }));
    const s = await screen.findByRole('dialog', { name: /매장 1 정산 81,000원/ });
    expect(s).toHaveTextContent('KB국민은행 99887766 (루미 대표)');
    await userEvent.click(within(s).getByRole('button', { name: '송금 완료' }));
    const dialog = await screen.findByRole('dialog', { name: '송금 완료로 처리할까요?' });
    expect(dialog).toHaveTextContent('KB국민은행 99887766(루미 대표)로 81,000원을 송금했나요?');
    await userEvent.click(within(dialog).getByRole('button', { name: '송금 완료' }));
    await vi.waitFor(() => expect(input).toEqual({ settlementId: '1', note: null }));
    expect(await within(s).findByRole('status')).toHaveTextContent(
      `송금 완료 · 운영(ops.admin) · ${formatKst('2026-11-19T01:00:00.000Z', true)} · KB국민은행 ****7766(루미 대표)`,
    );
    // 남은 2건 중 계좌가 없는 2번은 건너뛴다
    await userEvent.click(within(s).getByRole('button', { name: '다음 건 (2건 남음)' }));
    await vi.waitFor(() => expect(query().get('settlementId')).toBe('3'));
  });

  it('이미 송금 완료된 정산(409)이면 토스트를 보이고 다시 읽는다', async () => {
    const { settlements } = settlementBackend([settlement('1')]);
    server.use(
      graphql.mutation('AdminTasksMarkSettlementPaid', () => {
        settlements.set('1', {
          ...settlements.get('1')!,
          status: 'PAID',
          paidAt: '2026-11-19T00:10:00.000Z',
          paidByLabel: '김관리(kim)',
          paidNote: '먼저 처리',
        });
        return HttpResponse.json({
          data: null,
          errors: [
            {
              message: '이미 송금 완료로 처리된 정산이에요.',
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
    boot('/tasks/settlements?settlementId=1');
    const s = await screen.findByRole('dialog', { name: /매장 1 정산/ });
    await userEvent.click(within(s).getByRole('button', { name: '송금 완료' }));
    const dialog = await screen.findByRole('dialog', { name: '송금 완료로 처리할까요?' });
    await userEvent.click(within(dialog).getByRole('button', { name: '송금 완료' }));
    expect(await screen.findByText('이미 송금 완료로 처리된 정산이에요.')).toBeInTheDocument();
    expect(await within(s).findByRole('status')).toHaveTextContent(
      `송금 완료 · 김관리(kim) · ${formatKst('2026-11-19T00:10:00.000Z', true)} · 먼저 처리`,
    );
  });

  it('송금 완료가 입력 오류로 거절되면 확인 창을 열어 둔다', async () => {
    settlementBackend([settlement('1')]);
    server.use(
      gqlError('AdminTasksMarkSettlementPaid', {
        message: '메모가 너무 깁니다.',
        code: 'TEXT_TOO_LONG',
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
    );
    boot('/tasks/settlements?settlementId=1');
    const s = await screen.findByRole('dialog', { name: /매장 1 정산/ });
    await userEvent.click(within(s).getByRole('button', { name: '송금 완료' }));
    const dialog = await screen.findByRole('dialog', { name: '송금 완료로 처리할까요?' });
    await userEvent.click(within(dialog).getByRole('button', { name: '송금 완료' }));
    expect(await screen.findByText('메모가 너무 깁니다.')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: '송금 완료로 처리할까요?' })).toBeInTheDocument();
  });
});
