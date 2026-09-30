import {
  type QueryKey,
  type UseQueryOptions,
  keepPreviousData,
  useQuery,
} from '@tanstack/react-query';
import { CheckIcon, ChevronsUpDownIcon, XIcon } from 'lucide-react';
import { type KeyboardEvent, useEffect, useId, useState } from 'react';

import { withJosa } from '@/shared/lib/josa';
import { isIdText } from '@/shared/lib/list-search';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/shared/ui/command';
import { IconButton } from '@/shared/ui/icon-button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

export interface EntityOption {
  /** 선택값으로 넘기는 ID(문자열 그대로) */
  id: string;
  /** 목록과 버튼에 보이는 이름 */
  label: string;
  /** 이름 옆 보조 정보(ID·상태 등) */
  description?: string;
}

interface Props<TQueryFnData, TKey extends QueryKey> {
  /** 무엇을 고르는지(예: '매장'). 접근 이름과 안내 문구에 쓴다 */
  label: string;
  /** 선택된 ID. 없으면 undefined */
  value: string | undefined;
  onChange: (id: string | undefined, option?: EntityOption) => void;
  /** 검색어 → 쿼리 옵션. 쿼리 키는 부르는 feature의 팩토리로 만든다 */
  searchQuery: (keyword: string) => UseQueryOptions<TQueryFnData, Error, EntityOption[], TKey>;
  /** 선택된 ID의 이름. 주소로 들어와 이름을 모를 때 부르는 쪽이 알려 준다 */
  selectedLabel?: string;
  placeholder?: string;
  /** false면 선택 해제 버튼을 두지 않는다 */
  clearable?: boolean;
  /**
   * 숫자를 입력하면 그 ID를 바로 고르는 항목을 둔다(기본 켬). 검색에 나오지 않는 삭제·숨김 대상도
   * ID로 거를 수 있어야 해서 — 필터가 아니라 새 값을 고르는 곳이면 끈다
   */
  idEntry?: boolean;
  disabled?: boolean;
  className?: string;
}

const DEBOUNCE_MS = 250;

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/**
 * 이름으로 검색해 하나를 고르는 선택기. 선택값은 ID 문자열이고, 검색·표시 방법은 부르는 쪽이 정한다.
 * 키보드: 버튼에서 ↓·Enter·Space로 열고, 검색칸에서 ↑↓로 이동, Enter로 선택, Esc로 닫는다.
 */
export function EntityPicker<TQueryFnData, TKey extends QueryKey>({
  label,
  value,
  onChange,
  searchQuery,
  selectedLabel,
  placeholder = `${label} 선택`,
  clearable = true,
  idEntry = true,
  disabled = false,
  className,
}: Props<TQueryFnData, TKey>) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [picked, setPicked] = useState<EntityOption>();
  const debounced = useDebounced(keyword.trim(), DEBOUNCE_MS);
  const labelId = useId();
  const valueId = useId();

  const results = useQuery({
    ...searchQuery(debounced),
    enabled: open,
    placeholderData: keepPreviousData,
  });
  const options = results.data ?? [];
  const typedId = keyword.trim();
  const idOption: EntityOption | undefined =
    idEntry && isIdText(typedId) && !options.some((o) => o.id === typedId)
      ? { id: typedId, label: `#${typedId}`, description: 'ID로 선택' }
      : undefined;

  const display =
    value === undefined
      ? undefined
      : (selectedLabel ?? (picked?.id === value ? picked.label : `#${value}`));

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) setKeyword('');
  };

  const select = (option: EntityOption) => {
    setPicked(option);
    changeOpen(false);
    if (option.id !== value) onChange(option.id, option);
  };

  const openWithArrow = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowDown' || open) return;
    e.preventDefault();
    changeOpen(true);
  };

  let emptyMessage = `찾는 ${withJosa(label, '이/가')} 없습니다.`;
  if (results.isError) emptyMessage = '목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
  else if (results.isPending || (results.isFetching && options.length === 0)) {
    emptyMessage = '검색하고 있습니다.';
  }

  return (
    <span className={cn('flex items-center gap-1', className)}>
      <span id={labelId} className="sr-only">
        {label}
      </span>
      <Popover open={open} onOpenChange={changeOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-labelledby={`${labelId} ${valueId}`}
            disabled={disabled}
            className="h-9 w-48 justify-between px-3 font-normal"
            onKeyDown={openWithArrow}
          >
            <span
              id={valueId}
              className={cn('truncate', display === undefined && 'text-muted-foreground')}
            >
              {display ?? placeholder}
            </span>
            <ChevronsUpDownIcon className="size-4 opacity-50" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          {/* cmdk는 Command의 label을 검색칸 이름으로, List의 label을 결과 목록 이름으로 쓴다 */}
          <Command shouldFilter={false} label={`${label} 검색`}>
            <CommandInput
              placeholder={idEntry ? '이름 또는 ID로 검색' : '이름으로 검색'}
              value={keyword}
              onValueChange={setKeyword}
            />
            <CommandList label={`${label} 검색 결과`}>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              {[...(idOption ? [idOption] : []), ...options].map((option) => (
                <CommandItem key={option.id} value={option.id} onSelect={() => select(option)}>
                  <CheckIcon
                    className={cn('size-4', option.id === value ? 'opacity-100' : 'opacity-0')}
                    aria-hidden
                  />
                  <span className="truncate">{option.label}</span>
                  {option.description && (
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {clearable && value !== undefined && (
        <IconButton
          label={`${label} 선택 해제`}
          size="icon-sm"
          disabled={disabled}
          onClick={() => onChange(undefined)}
        >
          <XIcon />
        </IconButton>
      )}
    </span>
  );
}
