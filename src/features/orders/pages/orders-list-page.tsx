import { useQuery } from '@tanstack/react-query';

import { messageFor } from '@/shared/api';
import { Card } from '@/shared/ui/card';
import { CursorPager } from '@/shared/ui/cursor-pager';
import { PageHeader } from '@/shared/ui/page-header';

import { ordersListQueryOptions } from '../api/queries';
import { OrdersFilterBar } from '../components/orders-filter-bar';
import { OrdersTable } from '../components/orders-table';
import { type OrdersSearch, type OrdersSearchInput, toOrderListInput } from '../search';

interface Props {
  search: OrdersSearch;
  /** 필터 변경은 커서를 버리고 첫 페이지부터 */
  onSearchChange: (next: OrdersSearchInput) => void;
}

export function OrdersListPage({ search, onSearchChange }: Props) {
  const list = useQuery(ordersListQueryOptions(toOrderListInput(search)));
  const patch = (p: Partial<OrdersSearch>) =>
    onSearchChange({ ...search, ...p, cursor: undefined });
  return (
    <>
      <PageHeader
        title="주문"
        meta={list.data ? `전체 ${list.data.totalCount.toLocaleString('ko-KR')}건` : undefined}
      />
      <Card className="gap-0 py-0">
        <OrdersFilterBar
          search={search}
          onChange={patch}
          onReset={() => onSearchChange({ limit: search.limit })}
        />
        {list.isError ? (
          <p role="alert" className="px-4 py-8 text-center text-sm text-negative-foreground">
            {messageFor(list.error)}
          </p>
        ) : (
          <OrdersTable rows={list.data?.items ?? []} isLoading={list.isPending} />
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
