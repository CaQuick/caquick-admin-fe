import { useQuery } from '@tanstack/react-query';

import { messageFor } from '@/shared/api';
import { Card } from '@/shared/ui/card';
import { CursorPager } from '@/shared/ui/cursor-pager';
import { EntityPicker } from '@/shared/ui/entity-picker';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterField } from '@/shared/ui/filter-field';
import { PageHeader } from '@/shared/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { productsListQueryOptions, storeOptionsQueryOptions } from '../api/queries';
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
  // 주소로 매장 필터가 들어오면 선택기는 이름을 모른다 — 걸러진 목록의 매장명을 빌려 쓴다
  const filteredStoreName = list.data?.items.find((p) => p.storeId === search.storeId)?.storeName;
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
          <FilterField label="노출 상태">
            <Select
              value={search.active ?? ALL}
              onValueChange={(v) =>
                patch({ active: v === ALL ? undefined : (v as 'true' | 'false') })
              }
            >
              <SelectTrigger className="h-9 w-28" aria-label="노출 상태">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>전체</SelectItem>
                <SelectItem value="true">노출</SelectItem>
                <SelectItem value="false">숨김</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="매장">
            <EntityPicker
              label="매장"
              value={search.storeId}
              selectedLabel={filteredStoreName}
              onChange={(storeId) => patch({ storeId })}
              searchQuery={storeOptionsQueryOptions}
              placeholder="전체 매장"
            />
          </FilterField>
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
            page={list.data}
            search={search}
            isFetching={list.isFetching}
            onCursorChange={(cursor) => onSearchChange({ ...search, cursor })}
          />
        )}
      </Card>
    </>
  );
}
