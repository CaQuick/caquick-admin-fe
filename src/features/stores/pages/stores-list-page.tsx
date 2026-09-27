import { useQuery } from '@tanstack/react-query';

import { messageFor } from '@/shared/api';
import { Card } from '@/shared/ui/card';
import { CursorPager } from '@/shared/ui/cursor-pager';
import { FilterBar } from '@/shared/ui/filter-bar';
import { Input } from '@/shared/ui/input';
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
        meta={list.data ? `전체 ${list.data.totalCount.toLocaleString('ko-KR')}개` : undefined}
      />
      <Card className="gap-0 py-0">
        <FilterBar
          keyword={search.q ?? ''}
          keywordPlaceholder="매장명"
          onKeywordSubmit={(q) => patch({ q: q || undefined })}
          hasActiveFilters={hasStoreFilters(search)}
          onReset={() => onSearchChange({ limit: search.limit })}
        >
          <Select
            value={search.active ?? ALL}
            onValueChange={(v) =>
              patch({ active: v === ALL ? undefined : (v as 'true' | 'false') })
            }
          >
            <SelectTrigger className="h-9 w-32" aria-label="활성 여부">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>전체</SelectItem>
              <SelectItem value="true">활성</SelectItem>
              <SelectItem value="false">비활성</SelectItem>
            </SelectContent>
          </Select>
          <Input
            aria-label="지역 ID"
            placeholder="지역 ID"
            className="h-9 w-24"
            key={`r-${search.regionId ?? ''}`}
            defaultValue={search.regionId ?? ''}
            onBlur={(e) => patch({ regionId: e.target.value.trim() || undefined })}
          />
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
