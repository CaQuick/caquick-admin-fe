import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
import { formatKst } from '@/shared/lib/kst';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';

import { storeSettlementAccountQueryOptions, upsertStoreSettlementAccount } from '../api/queries';
import { actorLabel } from '../status';
import { AccountNumber } from './account-number';
import { BankAccountDialog } from './bank-account-dialog';

/** 매장 상세의 정산 계좌. 판매자가 앱에서 등록하고, 관리자도 사유를 남겨 고칠 수 있다 */
export function StoreSettlementAccountCard({
  storeId,
  className,
}: {
  storeId: string;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const q = useQuery(storeSettlementAccountQueryOptions(storeId));
  const account = q.data;
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm">정산 계좌</CardTitle>
        {q.isSuccess && (
          <BankAccountDialog
            trigger={
              <Button variant="outline" size="sm">
                {account ? '변경' : '등록'}
              </Button>
            }
            title={account ? '정산 계좌 변경' : '정산 계좌 등록'}
            description="판매자 대신 등록·변경합니다. 이 기록은 판매자 감사 로그에도 보입니다."
            initial={
              account
                ? {
                    bankCode: account.bank.code,
                    accountNumber: account.accountNumber,
                    accountHolder: account.accountHolder,
                  }
                : null
            }
            onSubmit={async (input) => {
              await upsertStoreSettlementAccount(queryClient, { storeId, ...input });
              toast.success('정산 계좌를 저장했습니다.');
            }}
          />
        )}
      </CardHeader>
      <CardContent>
        {q.isError ? (
          <p role="alert" className="text-sm text-negative-foreground">
            {messageFor(q.error)}
          </p>
        ) : q.isPending ? (
          <Skeleton className="h-16" aria-busy />
        ) : account ? (
          <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">은행</dt>
            <dd>{account.bank.name}</dd>
            <dt className="text-muted-foreground">계좌번호</dt>
            <dd>
              <AccountNumber value={account.accountNumber} />
            </dd>
            <dt className="text-muted-foreground">예금주</dt>
            <dd>{account.accountHolder}</dd>
            <dt className="text-muted-foreground">마지막 변경</dt>
            <dd className="tabular-nums">
              {actorLabel(account.updatedByRole)} · {formatKst(account.updatedAt, true)}
            </dd>
          </dl>
        ) : (
          <p className="text-sm text-caution-foreground">
            등록된 정산 계좌가 없어 정산을 송금 완료로 처리할 수 없습니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
