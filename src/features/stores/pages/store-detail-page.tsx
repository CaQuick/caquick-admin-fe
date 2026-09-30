import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ExternalLinkIcon, HistoryIcon } from 'lucide-react';

import { AccountStatusPill } from '@/features/accounts';
import { RegionName } from '@/features/regions';
import { messageFor } from '@/shared/api';
import { parseCoordPair } from '@/shared/lib/coords';
import { formatCount } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { NaverMap } from '@/shared/ui/naver-map';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import { storeDetailQueryOptions } from '../api/queries';
import { StoreActiveToggle } from '../components/store-active-toggle';
import { StoreEditForm } from '../components/store-edit-form';
import { StoreVisibilityPill } from '../components/store-visibility-pill';
import { MAP_PROVIDER_LABEL, kakaoMapLink } from '../location-schema';

const linkClass = 'text-primary-soft-foreground hover:underline';

export function StoreDetailPage({ storeId }: { storeId: string }) {
  const q = useQuery(storeDetailQueryOptions(storeId));
  if (q.isError) {
    return (
      <>
        <PageHeader title="매장" back={{ to: '/stores' }} />
        <p role="alert" className="text-sm text-negative-foreground">
          {messageFor(q.error)}
        </p>
      </>
    );
  }
  if (!q.data) return <Skeleton className="h-64" aria-busy />;
  const { store, seller, productCount, orderItemCount } = q.data;
  const position = parseCoordPair(store.latitude ?? '', store.longitude ?? '');
  return (
    <>
      <PageHeader
        back={{ to: '/stores' }}
        title={store.storeName}
        meta={<StoreVisibilityPill isActive={store.isActive} />}
        description={`매장 ID ${store.id} · 등록일 ${formatKst(store.createdAt, true)} · 수정일 ${formatKst(store.updatedAt, true)}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/audit-logs" search={{ storeId: store.id }}>
                <HistoryIcon className="size-4" /> 감사 이력
              </Link>
            </Button>
            <StoreActiveToggle
              storeId={store.id}
              storeName={store.storeName}
              isActive={store.isActive}
            />
          </>
        }
      />
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="edit">기본 정보 수정</TabsTrigger>
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
                    className={linkClass}
                  >
                    {store.sellerLabel ?? `#${seller.accountId}`}
                  </Link>
                  <AccountStatusPill status={seller.status} />
                </dd>
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
              <dl className="grid grid-cols-[128px_1fr] gap-x-3 gap-y-1.5 text-sm tabular-nums">
                <dt className="text-muted-foreground">상품</dt>
                <dd>
                  {formatCount(productCount)}개 ·{' '}
                  <Link to="/products" search={{ storeId: store.id }} className={linkClass}>
                    상품 보기
                  </Link>
                </dd>
                <dt className="text-muted-foreground">주문된 수량(누적)</dt>
                <dd>
                  {formatCount(orderItemCount)}건 ·{' '}
                  <Link to="/orders" search={{ storeId: store.id }} className={linkClass}>
                    주문 보기
                  </Link>
                </dd>
                <dt className="text-muted-foreground">리뷰</dt>
                <dd>
                  <Link to="/reviews" search={{ storeId: store.id }} className={linkClass}>
                    리뷰 보기
                  </Link>
                </dd>
                <dt className="text-muted-foreground">픽업 슬롯</dt>
                <dd>{store.pickupSlotIntervalMinutes}분 간격</dd>
                <dt className="text-muted-foreground">최소 주문 마감</dt>
                <dd>픽업 {store.minLeadTimeMinutes}분 전</dd>
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
              <div className="grid aspect-square w-32 place-items-center overflow-hidden rounded-lg border bg-surface-tint">
                {store.profileImageUrl ? (
                  <img src={store.profileImageUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground">이미지 없음</span>
                )}
              </div>
              <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-1.5 text-sm">
                <dt className="text-muted-foreground">매장 전화</dt>
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
                <dd>{store.regionId ? <RegionName regionId={store.regionId} /> : '—'}</dd>
                <dt className="text-muted-foreground">좌표</dt>
                <dd className="tabular-nums">
                  {position ? `${store.latitude}, ${store.longitude}` : '—'}
                </dd>
                <dt className="text-muted-foreground">지도 제공자</dt>
                <dd>{MAP_PROVIDER_LABEL[store.mapProvider]}</dd>
                <dt className="text-muted-foreground">웹사이트</dt>
                <dd className="break-all">
                  {store.websiteUrl ? (
                    <a
                      href={store.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      {store.websiteUrl}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
                <dt className="text-muted-foreground">영업시간</dt>
                <dd className="whitespace-pre-line">{store.businessHoursText ?? '—'}</dd>
                <dt className="text-muted-foreground">인사말</dt>
                <dd className="whitespace-pre-line">{store.greetingMessage ?? '—'}</dd>
              </dl>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">위치</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {position && store.latitude && store.longitude ? (
                <>
                  <NaverMap label="매장 위치 지도" position={position} />
                  {store.mapProvider !== 'NAVER' && (
                    <p className="text-xs text-muted-foreground">
                      지도 제공자가 네이버 지도가 아니라 구매자 앱에는 지도가 나오지 않습니다.
                    </p>
                  )}
                  <a
                    href={kakaoMapLink(store.storeName, store.latitude, store.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex w-fit items-center gap-1 text-sm ${linkClass}`}
                  >
                    카카오맵에서 보기 <ExternalLinkIcon className="size-3.5" aria-hidden />
                  </a>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  좌표가 없습니다. 기본 정보 수정에서 주소를 검색하면 좌표를 채울 수 있습니다.
                </p>
              )}
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
