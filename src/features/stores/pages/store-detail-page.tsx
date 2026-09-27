import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { AccountStatusPill } from '@/features/accounts';
import { messageFor } from '@/shared/api';
import { formatCount } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';
import { StatusPill } from '@/shared/ui/status-pill';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import { storeDetailQueryOptions } from '../api/queries';
import { StoreActiveToggle } from '../components/store-active-toggle';
import { StoreEditForm } from '../components/store-edit-form';

export function StoreDetailPage({ storeId }: { storeId: string }) {
  const q = useQuery(storeDetailQueryOptions(storeId));
  if (q.isError) {
    return (
      <>
        <PageHeader title="매장" />
        <p role="alert" className="text-sm text-negative-foreground">
          {messageFor(q.error)}
        </p>
        <Button asChild variant="link" className="px-0">
          <Link to="/stores">목록으로</Link>
        </Button>
      </>
    );
  }
  if (!q.data) return <Skeleton className="h-64" aria-busy />;
  const { store, seller, productCount, orderItemCount } = q.data;
  return (
    <>
      <PageHeader
        title={store.storeName}
        meta={
          <StatusPill tone={store.isActive ? 'positive' : 'neutral'}>
            {store.isActive ? '활성' : '비활성'}
          </StatusPill>
        }
        description={`매장 ID ${store.id} · 생성 ${formatKst(store.createdAt, true)} · 수정 ${formatKst(store.updatedAt, true)}`}
        actions={
          <StoreActiveToggle
            storeId={store.id}
            storeName={store.storeName}
            isActive={store.isActive}
          />
        }
      />
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="edit">기본정보 수정</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="grid gap-3 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">판매자</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-1.5 text-sm">
                <dt className="text-muted-foreground">계정</dt>
                <dd className="flex items-center gap-2">
                  <Link
                    to="/sellers/$accountId"
                    params={{ accountId: seller.accountId }}
                    className="text-primary-soft-foreground hover:underline"
                  >
                    {seller.username ?? `#${seller.accountId}`}
                  </Link>
                  <AccountStatusPill status={seller.status} />
                </dd>
                <dt className="text-muted-foreground">이름</dt>
                <dd>{seller.name ?? '—'}</dd>
                <dt className="text-muted-foreground">이메일</dt>
                <dd className="break-all">{seller.email ?? '—'}</dd>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">집계 · 픽업 설정</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 text-sm tabular-nums">
                <dt className="text-muted-foreground">상품</dt>
                <dd>
                  {formatCount(productCount)}개 ·{' '}
                  <Link
                    to="/orders"
                    search={{ storeId: store.id }}
                    className="text-primary-soft-foreground hover:underline"
                  >
                    주문 보기
                  </Link>
                </dd>
                <dt className="text-muted-foreground">주문 아이템</dt>
                <dd>{formatCount(orderItemCount)}건</dd>
                <dt className="text-muted-foreground">픽업 슬롯</dt>
                <dd>{store.pickupSlotIntervalMinutes}분 간격</dd>
                <dt className="text-muted-foreground">최소 리드타임</dt>
                <dd>{store.minLeadTimeMinutes}분</dd>
                <dt className="text-muted-foreground">최대 예약</dt>
                <dd>{store.maxDaysAhead}일 앞까지</dd>
              </dl>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">매장 정보</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-[128px_1fr]">
              <div className="aspect-square w-32 overflow-hidden rounded-lg border bg-surface-tint">
                {store.profileImageUrl && (
                  <img src={store.profileImageUrl} alt="" className="size-full object-cover" />
                )}
              </div>
              <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-1.5 text-sm">
                <dt className="text-muted-foreground">전화</dt>
                <dd>{store.storePhone}</dd>
                <dt className="text-muted-foreground">주소</dt>
                <dd>
                  {store.addressFull}
                  {(store.addressCity ?? store.addressDistrict ?? store.addressNeighborhood) && (
                    <span className="block text-xs text-muted-foreground">
                      {[store.addressCity, store.addressDistrict, store.addressNeighborhood]
                        .filter(Boolean)
                        .join(' ')}
                    </span>
                  )}
                </dd>
                <dt className="text-muted-foreground">지역</dt>
                <dd>{store.regionId ? `#${store.regionId}` : '—'}</dd>
                <dt className="text-muted-foreground">좌표</dt>
                <dd>
                  {store.latitude && store.longitude
                    ? `${store.latitude}, ${store.longitude} (${store.mapProvider})`
                    : '—'}
                </dd>
                <dt className="text-muted-foreground">웹사이트</dt>
                <dd className="break-all">{store.websiteUrl ?? '—'}</dd>
                <dt className="text-muted-foreground">영업시간</dt>
                <dd className="whitespace-pre-line">{store.businessHoursText ?? '—'}</dd>
                <dt className="text-muted-foreground">인사말</dt>
                <dd className="whitespace-pre-line">{store.greetingMessage ?? '—'}</dd>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="edit">
          <StoreEditForm key={store.updatedAt} store={store} onSaved={() => undefined} />
        </TabsContent>
      </Tabs>
    </>
  );
}
