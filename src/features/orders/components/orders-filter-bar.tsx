import { Input } from '@/shared/ui/input';
import { FilterBar } from '@/shared/ui/filter-bar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { type OrdersSearch, hasOrderFilters } from '../search';
import { ORDER_STATUS } from '../status';

const ALL = '__all__';

interface Props {
  search: OrdersSearch;
  onChange: (patch: Partial<OrdersSearch>) => void;
  onReset: () => void;
}

export function OrdersFilterBar({ search, onChange, onReset }: Props) {
  return (
    <FilterBar
      keyword={search.q ?? ''}
      keywordPlaceholder="주문번호, 주문자 이름, 전화번호"
      onKeywordSubmit={(q) => onChange({ q: q || undefined })}
      hasActiveFilters={hasOrderFilters(search)}
      onReset={onReset}
    >
      <Select
        value={search.status ?? ALL}
        onValueChange={(v) =>
          onChange({ status: v === ALL ? undefined : (v as OrdersSearch['status']) })
        }
      >
        <SelectTrigger className="h-9 w-36" aria-label="상태">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>상태 전체</SelectItem>
          {ORDER_STATUS.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="date"
        aria-label="생성일 시작"
        className="h-9 w-36"
        value={search.from ?? ''}
        onChange={(e) => onChange({ from: e.target.value || undefined })}
      />
      <span className="text-xs text-muted-foreground">~</span>
      <Input
        type="date"
        aria-label="생성일 끝"
        className="h-9 w-36"
        value={search.to ?? ''}
        onChange={(e) => onChange({ to: e.target.value || undefined })}
      />
      <Input
        aria-label="매장 ID"
        placeholder="매장 ID"
        className="h-9 w-24"
        defaultValue={search.storeId ?? ''}
        key={`s-${search.storeId ?? ''}`}
        onBlur={(e) => onChange({ storeId: e.target.value.trim() || undefined })}
      />
      <Input
        aria-label="계정 ID"
        placeholder="계정 ID"
        className="h-9 w-24"
        defaultValue={search.accountId ?? ''}
        key={`a-${search.accountId ?? ''}`}
        onBlur={(e) => onChange({ accountId: e.target.value.trim() || undefined })}
      />
    </FilterBar>
  );
}
