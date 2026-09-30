import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { HistoryIcon } from 'lucide-react';

import { messageFor } from '@/shared/api';
import { formatCount, formatKrw } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';
import { StatusPill } from '@/shared/ui/status-pill';

import { productDetailQueryOptions } from '../api/queries';
import { ProductActiveToggle } from '../components/product-active-toggle';
import { ProductOptionsCard } from '../components/product-options-card';
import { ProductTaxonomyCard } from '../components/product-taxonomy-card';
import { ProductTemplateCard } from '../components/product-template-card';

export function ProductDetailPage({ productId }: { productId: string }) {
  const q = useQuery(productDetailQueryOptions(productId));
  if (q.isError) {
    return (
      <>
        <PageHeader title="상품" back={{ to: '/products' }} />
        <p role="alert" className="text-sm text-negative-foreground">
          {messageFor(q.error)}
        </p>
      </>
    );
  }
  if (!q.data) return <Skeleton className="h-64" aria-busy />;
  const {
    product: p,
    storeIsActive,
    description,
    purchaseNotice,
    preparationTimeMinutes,
    imageUrls,
    reviewCount,
    orderItemCount,
    categories,
    tags,
    optionGroups,
    customTemplate,
  } = q.data;
  return (
    <>
      <PageHeader
        back={{ to: '/products' }}
        title={p.name}
        meta={
          <span className="flex items-center gap-1.5">
            <StatusPill tone={p.isActive ? 'positive' : 'neutral'}>
              {p.isActive ? '노출' : '숨김'}
            </StatusPill>
            {!storeIsActive && <StatusPill tone="caution">매장 숨김</StatusPill>}
          </span>
        }
        description={`상품 ID ${p.id} · 등록일 ${formatKst(p.createdAt, true)} · 수정일 ${formatKst(p.updatedAt, true)}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/audit-logs" search={{ targetType: 'PRODUCT', targetId: p.id }}>
                <HistoryIcon className="size-4" /> 감사 이력
              </Link>
            </Button>
            <ProductActiveToggle
              productId={p.id}
              name={p.name}
              isActive={p.isActive}
              storeIsActive={storeIsActive}
            />
          </>
        }
      />
      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">이미지 {imageUrls.length}장</CardTitle>
            </CardHeader>
            <CardContent>
              {imageUrls.length === 0 ? (
                <p className="text-sm text-muted-foreground">등록된 이미지가 없습니다.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {imageUrls.map((url, i) => (
                    <li key={url}>
                      <a href={url} target="_blank" rel="noreferrer">
                        <img
                          src={url}
                          alt={`상품 이미지 ${i + 1}`}
                          className="size-24 rounded-md border object-cover"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">설명 · 구매 안내</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <p className="whitespace-pre-line">{description ?? '—'}</p>
              <div>
                <div className="text-xs text-muted-foreground">구매 안내</div>
                <p className="whitespace-pre-line">{purchaseNotice ?? '—'}</p>
              </div>
            </CardContent>
          </Card>
          <ProductOptionsCard optionGroups={optionGroups} />
          <ProductTemplateCard template={customTemplate} />
        </div>
        <div className="flex flex-col gap-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">가격 · 매장</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[88px_1fr] gap-x-3 gap-y-1.5 text-sm tabular-nums">
                <dt className="text-muted-foreground">정가</dt>
                <dd>{formatKrw(p.regularPrice)}</dd>
                <dt className="text-muted-foreground">판매가</dt>
                <dd>
                  {p.salePrice !== null && p.salePrice !== undefined ? formatKrw(p.salePrice) : '—'}
                </dd>
                <dt className="text-muted-foreground">준비 시간</dt>
                <dd>{preparationTimeMinutes}분</dd>
                <dt className="text-muted-foreground">매장</dt>
                <dd>
                  <Link
                    to="/stores/$storeId"
                    params={{ storeId: p.storeId }}
                    className="text-primary-soft-foreground hover:underline"
                  >
                    {p.storeName}
                  </Link>
                </dd>
              </dl>
            </CardContent>
          </Card>
          <ProductTaxonomyCard categories={categories} tags={tags} />
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">집계</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[88px_1fr] gap-x-3 gap-y-1.5 text-sm tabular-nums">
                <dt className="text-muted-foreground">리뷰</dt>
                <dd>{formatCount(reviewCount)}건</dd>
                <dt className="text-muted-foreground">주문 건수(누적)</dt>
                <dd>{formatCount(orderItemCount)}건</dd>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
