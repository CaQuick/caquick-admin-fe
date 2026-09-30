import { useQuery } from '@tanstack/react-query';

import { RegionPicker } from '@/features/regions';
import { messageFor } from '@/shared/api';
import { formatCount } from '@/shared/lib/format';
import { Card } from '@/shared/ui/card';
import { CursorPager } from '@/shared/ui/cursor-pager';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterField } from '@/shared/ui/filter-field';
import { PageHeader } from '@/shared/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { storesListQueryOptions } from '../api/queries';
import { StoresTable } from '../components/stores-table';
import {
  type StoresSearch,
  type StoresSearchInput,
  hasStoreFilters,
  toStoreListInput,
} from '../search';

const ALL = '__all__';

interface Props {
  search: StoresSearch;
  onSearchChange: (next: StoresSearchInput) => void;
}

export function StoresListPage({ search, onSearchChange }: Props) {
  const list = useQuery(storesListQueryOptions(toStoreListInput(search)));
  const patch = (p: Partial<StoresSearchInput>) =>
    onSearchChange({ ...search, ...p, cursor: undefined });
  return (
    <>
      <PageHeader
        title="매장"
        meta={list.data ? `전체 ${formatCount(list.data.totalCount)}곳` : undefined}
      />
      <Card className="gap-0 py-0">
        <FilterBar
          keyword={search.q ?? ''}
          keywordPlaceholder="매장명"
          onKeywordSubmit={(q) => patch({ q: q || undefined })}
          hasActiveFilters={hasStoreFilters(search)}
          onReset={() => onSearchChange({ limit: search.limit })}
        >
          <FilterField label="노출">
            <Select
              value={search.active ?? ALL}
              onValueChange={(v) =>
                patch({ active: v === ALL ? undefined : (v as 'true' | 'false') })
              }
            >
              <SelectTrigger className="h-9 w-28" aria-label="노출 여부">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>전체</SelectItem>
                <SelectItem value="true">노출</SelectItem>
                <SelectItem value="false">숨김</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="지역">
            <RegionPicker value={search.regionId} onChange={(v) => patch({ regionId: v })} />
          </FilterField>
        </FilterBar>
        {list.isError ? (
          <p role="alert" className="px-4 py-8 text-center text-sm text-negative-foreground">
            {messageFor(list.error)}
          </p>
        ) : (
          <StoresTable rows={list.data?.items ?? []} isLoading={list.isPending} />
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
