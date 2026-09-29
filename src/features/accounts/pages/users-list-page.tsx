import { useQuery } from '@tanstack/react-query';

import { messageFor } from '@/shared/api';
import { Card } from '@/shared/ui/card';
import { CursorPager } from '@/shared/ui/cursor-pager';
import { FilterBar } from '@/shared/ui/filter-bar';
import { PageHeader } from '@/shared/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { usersListQueryOptions } from '../api/queries';
import { UsersTable } from '../components/users-table';
import {
  type UsersSearch,
  type UsersSearchInput,
  hasUserFilters,
  toUserListInput,
} from '../search';
import { ACCOUNT_STATUS } from '../status';

const ALL = '__all__';

interface Props {
  search: UsersSearch;
  onSearchChange: (next: UsersSearchInput) => void;
}

export function UsersListPage({ search, onSearchChange }: Props) {
  const list = useQuery(usersListQueryOptions(toUserListInput(search)));
  const patch = (p: Partial<UsersSearchInput>) =>
    onSearchChange({ ...search, ...p, cursor: undefined });
  return (
    <>
      <PageHeader
        title="구매자"
        meta={list.data ? `전체 ${list.data.totalCount.toLocaleString('ko-KR')}명` : undefined}
      />
      <Card className="gap-0 py-0">
        <FilterBar
          keyword={search.q ?? ''}
          keywordPlaceholder="닉네임, 이메일, 이름"
          onKeywordSubmit={(q) => patch({ q: q || undefined })}
          hasActiveFilters={hasUserFilters(search)}
          onReset={() => onSearchChange({ limit: search.limit })}
        >
          <Select
            value={search.status ?? ALL}
            onValueChange={(v) =>
              patch({ status: v === ALL ? undefined : (v as UsersSearch['status']) })
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
          <UsersTable rows={list.data?.items ?? []} isLoading={list.isPending} />
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
