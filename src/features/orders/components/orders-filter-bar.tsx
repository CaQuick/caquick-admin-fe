import { useQuery } from '@tanstack/react-query';

import { EntityPicker } from '@/shared/ui/entity-picker';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterField } from '@/shared/ui/filter-field';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import {
  buyerNameQueryOptions,
  buyerOptionsQueryOptions,
  storeNameQueryOptions,
  storeOptionsQueryOptions,
} from '../api/queries';
import { type OrdersSearch, hasOrderFilters } from '../search';
import { ORDER_STATUS } from '../status';

const ALL = '__all__';

interface Props {
  search: OrdersSearch;
  onChange: (patch: Partial<OrdersSearch>) => void;
  onReset: () => void;
}

export function OrdersFilterBar({ search, onChange, onReset }: Props) {
  // 주소로 들어온 ID(매장 상세의 '주문 보기' 등)는 이름을 따로 불러 선택기에 보인다
  const storeName = useQuery({
    ...storeNameQueryOptions(search.storeId ?? ''),
    enabled: search.storeId !== undefined,
  });
  const buyerName = useQuery({
    ...buyerNameQueryOptions(search.accountId ?? ''),
    enabled: search.accountId !== undefined,
  });
  return (
    <FilterBar
      keyword={search.q ?? ''}
      keywordPlaceholder="주문번호, 주문자 이름, 전화번호"
      onKeywordSubmit={(q) => onChange({ q: q || undefined })}
      hasActiveFilters={hasOrderFilters(search)}
      onReset={onReset}
    >
      <FilterField label="상태">
        <Select
          value={search.status ?? ALL}
          onValueChange={(v) =>
            onChange({ status: v === ALL ? undefined : (v as OrdersSearch['status']) })
          }
        >
          <SelectTrigger className="h-9 w-32" aria-label="주문 상태">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>전체</SelectItem>
            {ORDER_STATUS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>
      <FilterField label="주문일">
        <Input
          type="date"
          aria-label="주문일 시작"
          className="h-9 w-36"
          value={search.from ?? ''}
          onChange={(e) => onChange({ from: e.target.value || undefined })}
        />
        <span className="text-xs text-muted-foreground" aria-hidden>
          ~
        </span>
        <Input
          type="date"
          aria-label="주문일 끝"
          className="h-9 w-36"
          value={search.to ?? ''}
          onChange={(e) => onChange({ to: e.target.value || undefined })}
        />
      </FilterField>
      <FilterField label="매장">
        <EntityPicker
          label="매장"
          value={search.storeId}
          selectedLabel={storeName.data}
          searchQuery={storeOptionsQueryOptions}
          onChange={(storeId) => onChange({ storeId })}
        />
      </FilterField>
      <FilterField label="구매자">
        <EntityPicker
          label="구매자"
          value={search.accountId}
          selectedLabel={buyerName.data ?? undefined}
          searchQuery={buyerOptionsQueryOptions}
          onChange={(accountId) => onChange({ accountId })}
        />
      </FilterField>
    </FilterBar>
  );
}
