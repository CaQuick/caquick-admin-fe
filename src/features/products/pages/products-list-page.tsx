import { useQuery } from '@tanstack/react-query';

import { messageFor } from '@/shared/api';
import { Card } from '@/shared/ui/card';
import { CursorPager } from '@/shared/ui/cursor-pager';
import { FilterBar } from '@/shared/ui/filter-bar';
import { IdFilterInput } from '@/shared/ui/id-filter-input';
import { PageHeader } from '@/shared/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { productsListQueryOptions } from '../api/queries';
import { ProductsTable } from '../components/products-table';
import {
  type ProductsSearch,
  type ProductsSearchInput,
  hasProductFilters,
  toProductListInput,
} from '../search';

const ALL = '__all__';

interface Props {
  search: ProductsSearch;
  onSearchChange: (next: ProductsSearchInput) => void;
}

export function ProductsListPage({ search, onSearchChange }: Props) {
  const list = useQuery(productsListQueryOptions(toProductListInput(search)));
  const patch = (p: Partial<ProductsSearchInput>) =>
    onSearchChange({ ...search, ...p, cursor: undefined });
  return (
    <>
      <PageHeader
        title="상품"
        meta={list.data ? `전체 ${list.data.totalCount.toLocaleString('ko-KR')}개` : undefined}
      />
      <Card className="gap-0 py-0">
        <FilterBar
          keyword={search.q ?? ''}
          keywordPlaceholder="상품명"
          onKeywordSubmit={(q) => patch({ q: q || undefined })}
          hasActiveFilters={hasProductFilters(search)}
          onReset={() => onSearchChange({ limit: search.limit })}
        >
          <Select
            value={search.active ?? ALL}
            onValueChange={(v) =>
              patch({ active: v === ALL ? undefined : (v as 'true' | 'false') })
            }
          >
            <SelectTrigger className="h-9 w-32" aria-label="노출 여부">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>전체</SelectItem>
              <SelectItem value="true">노출</SelectItem>
              <SelectItem value="false">숨김</SelectItem>
            </SelectContent>
          </Select>
          <IdFilterInput
            label="매장 ID"
            value={search.storeId}
            onCommit={(v) => patch({ storeId: v })}
          />
        </FilterBar>
        {list.isError ? (
          <p role="alert" className="px-4 py-8 text-center text-sm text-negative-foreground">
            {messageFor(list.error)}
          </p>
        ) : (
          <ProductsTable rows={list.data?.items ?? []} isLoading={list.isPending} />
        )}
        {list.data && (
          <CursorPager
            totalCount={list.data.totalCount}
            shown={list.data.items.length}
            hasMore={list.data.hasMore}
            atStart={!search.cursor}
            isFetching={list.isFetching}
            onNext={() =>
              list.data?.nextCursor && onSearchChange({ ...search, cursor: list.data.nextCursor })
            }
            onReset={() => onSearchChange({ ...search, cursor: undefined })}
          />
        )}
      </Card>
    </>
  );
}
