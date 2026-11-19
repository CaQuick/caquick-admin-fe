import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { HistoryIcon } from 'lucide-react';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
import { formatKst } from '@/shared/lib/kst';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';

import { paymentSettingQueryOptions, updatePaymentSetting } from '../api/queries';
import { bpsToPercent } from '../commission-rate';
import { AccountNumber } from '../components/account-number';
import { BankAccountDialog } from '../components/bank-account-dialog';
import { CommissionRateDialog } from '../components/commission-rate-dialog';

export function PaymentSettingsPage() {
  const queryClient = useQueryClient();
  const q = useQuery(paymentSettingQueryOptions());
  if (q.isError) {
    return (
      <>
        <PageHeader title="결제 설정" />
        <p role="alert" className="text-sm text-negative-foreground">
          {messageFor(q.error)}
        </p>
      </>
    );
  }
  if (!q.data) return <Skeleton className="h-64" aria-busy />;
  const s = q.data;
  const account =
    s.depositBank && s.depositAccountNumber && s.depositAccountHolder
      ? {
          bank: s.depositBank,
          accountNumber: s.depositAccountNumber,
          accountHolder: s.depositAccountHolder,
        }
      : null;
  return (
    <>
      <PageHeader
        title="결제 설정"
        description={`플랫폼 전체에 하나뿐인 설정입니다. 마지막 변경 ${s.updatedAt ? formatKst(s.updatedAt, true) : '없음'}`}
        actions={
          <Button asChild variant="outline">
            <Link to="/audit-logs" search={{ targetType: 'PAYMENT_SETTING' }}>
              <HistoryIcon className="size-4" /> 감사 이력
            </Link>
          </Button>
        }
      />
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm">판매 수수료</CardTitle>
            <CommissionRateDialog currentBps={s.commissionRateBps} />
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <p className="text-2xl font-bold tabular-nums">{bpsToPercent(s.commissionRateBps)}%</p>
            <p className="text-xs text-muted-foreground">
              변경 이후 생성되는 주문부터 적용됩니다. 주문마다 생성 시점의 수수료율이 고정됩니다.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm">케이퀵 입금 계좌</CardTitle>
            <BankAccountDialog
              trigger={
                <Button variant="outline" size="sm">
                  {account ? '변경' : '등록'}
                </Button>
              }
              title={account ? '입금 계좌 변경' : '입금 계좌 등록'}
              description="구매자가 주문 금액을 입금하는 케이퀵 계좌입니다. 바꾸면 이후 주문의 입금 안내에 바로 쓰입니다."
              initial={
                account
                  ? {
                      bankCode: account.bank.code,
                      accountNumber: account.accountNumber,
                      accountHolder: account.accountHolder,
                    }
                  : null
              }
              onSubmit={async (v) => {
                await updatePaymentSetting(queryClient, {
                  depositBankCode: v.bankCode,
                  depositAccountNumber: v.accountNumber,
                  depositAccountHolder: v.accountHolder,
                  reason: v.reason,
                });
                toast.success('입금 계좌를 저장했습니다.');
              }}
            />
          </CardHeader>
          <CardContent>
            {account ? (
              <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-1.5 text-sm">
                <dt className="text-muted-foreground">은행</dt>
                <dd>{account.bank.name}</dd>
                <dt className="text-muted-foreground">계좌번호</dt>
                <dd>
                  <AccountNumber value={account.accountNumber} />
                </dd>
                <dt className="text-muted-foreground">예금주</dt>
                <dd>{account.accountHolder}</dd>
              </dl>
            ) : (
              <p
                role="alert"
                className="rounded-md bg-negative-soft px-3 py-2 text-sm text-negative-foreground"
              >
                입금 계좌가 없어 주문을 받을 수 없습니다.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
