import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { PlusIcon } from 'lucide-react';

import { ACCOUNT_STATUS } from '@/features/accounts';
import { messageFor } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { CursorPager } from '@/shared/ui/cursor-pager';
import { FilterBar } from '@/shared/ui/filter-bar';
import { PageHeader } from '@/shared/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { sellersListQueryOptions } from '../api/queries';
import { SellersTable } from '../components/sellers-table';
import {
  type SellersSearch,
  type SellersSearchInput,
  hasSellerFilters,
  toSellerListInput,
} from '../search';

const ALL = '__all__';

interface Props {
  search: SellersSearch;
  onSearchChange: (next: SellersSearchInput) => void;
}

export function SellersListPage({ search, onSearchChange }: Props) {
  const list = useQuery(sellersListQueryOptions(toSellerListInput(search)));
  const patch = (p: Partial<SellersSearchInput>) =>
    onSearchChange({ ...search, ...p, cursor: undefined });
  return (
    <>
      <PageHeader
        title="판매자"
        meta={list.data ? `전체 ${list.data.totalCount.toLocaleString('ko-KR')}명` : undefined}
        actions={
          <Button asChild>
            <Link to="/sellers/new">
              <PlusIcon className="size-4" /> 판매자 등록
            </Link>
          </Button>
        }
      />
      <Card className="gap-0 py-0">
        <FilterBar
          keyword={search.q ?? ''}
          keywordPlaceholder="아이디, 이메일, 이름, 매장명"
          onKeywordSubmit={(q) => patch({ q: q || undefined })}
          hasActiveFilters={hasSellerFilters(search)}
          onReset={() => onSearchChange({ limit: search.limit })}
        >
          <Select
            value={search.status ?? ALL}
            onValueChange={(v) =>
              patch({ status: v === ALL ? undefined : (v as SellersSearch['status']) })
            }
          >
            <SelectTrigger className="h-9 w-32" aria-label="상태">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>상태 전체</SelectItem>
              {ACCOUNT_STATUS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterBar>
        {list.isError ? (
          <p role="alert" className="px-4 py-8 text-center text-sm text-negative-foreground">
            {messageFor(list.error)}
          </p>
        ) : (
          <SellersTable rows={list.data?.items ?? []} isLoading={list.isPending} />
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
