import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { AccountStatusActions } from '@/features/accounts';
import { InProgressOrdersWarning, setStoreActive } from '@/features/stores';
import { type AccountStatus } from '@/graphql/generated/graphql';
import { messageFor } from '@/shared/api';
import { Checkbox } from '@/shared/ui/checkbox';
import { Label } from '@/shared/ui/label';

interface Props {
  accountId: string;
  status: AccountStatus;
  label: string;
  store: { id: string; isActive: boolean } | null | undefined;
  onChanged: () => Promise<void>;
}

/**
 * 판매자 정지. 매장 진행 주문을 경고하고, '매장도 숨기기'(기본 켬)면 정지 뒤 매장을 숨긴다.
 * 숨기기가 실패해도 정지는 되돌리지 않고 알리기만 한다 — 매장 화면에서 다시 숨기면 된다.
 */
export function SellerStatusActions({ accountId, status, label, store, onChanged }: Props) {
  const queryClient = useQueryClient();
  const [hideStore, setHideStore] = useState(true);
  // 정지·해제를 거치면 다음 정지는 다시 기본값(켬)에서 시작한다
  const [shownStatus, setShownStatus] = useState(status);
  if (shownStatus !== status) {
    setShownStatus(status);
    setHideStore(true);
  }
  const canHide = store?.isActive === true;
  return (
    <AccountStatusActions
      accountId={accountId}
      status={status}
      label={label}
      onChanged={onChanged}
      suspendExtra={
        store && (
          <>
            <InProgressOrdersWarning storeId={store.id} />
            {canHide && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="suspend-hide-store"
                  checked={hideStore}
                  onCheckedChange={(v) => setHideStore(v === true)}
                />
                <Label htmlFor="suspend-hide-store">매장도 숨기기</Label>
              </div>
            )}
          </>
        )
      }
      afterSuspend={
        store && canHide && hideStore
          ? async (reason) => {
              try {
                await setStoreActive(queryClient, store.id, false, reason);
              } catch (e) {
                toast.error(`계정은 정지했지만 매장을 숨기지 못했습니다. ${messageFor(e)}`);
              }
            }
          : undefined
      }
    />
  );
}
