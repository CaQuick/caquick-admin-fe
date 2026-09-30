import { useQuery } from '@tanstack/react-query';
import { XIcon } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { IconButton } from '@/shared/ui/icon-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { allRegionsQueryOptions } from '../api/queries';
import { areasOf, districtsOf } from '../lookup';

interface Props {
  /** 고른 시·군·구 ID. 없으면 undefined */
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  /** 매장에 연결할 지역을 고를 때 true. 숨긴 시·군·구는 BE가 거절해 목록에서 뺀다 */
  activeOnly?: boolean;
  /** 권역 선택 칸의 id(라벨 연결용) */
  id?: string;
  /** 접근 이름 앞부분(예: '지역') */
  label?: string;
  invalid?: boolean;
  className?: string;
}

const hiddenSuffix = (isActive: boolean) => (isActive ? '' : ' (숨김)');

/** 권역 → 시·군·구 2단 지역 선택기. 값은 시·군·구 ID 문자열이다. */
export function RegionPicker({
  value,
  onChange,
  activeOnly = false,
  id,
  label = '지역',
  invalid,
  className,
}: Props) {
  const regions = useQuery(allRegionsQueryOptions());
  const all = regions.data ?? [];
  const selected = value === undefined ? undefined : all.find((r) => r.id === value);
  // 고른 시·군·구가 있으면 그 권역, 없으면 사용자가 방금 고른 권역
  const [pickedArea, setPickedArea] = useState<string>();
  const area = selected?.parentId ?? (value === undefined ? pickedArea : undefined);
  const districts = area ? districtsOf(all, area, { activeOnly, currentId: value }) : [];
  // 목록에 없는 ID(삭제된 지역 등)도 값은 보여 준다
  const unknown = value !== undefined && regions.isSuccess && !selected;

  return (
    <span className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <Select
        value={area ?? ''}
        onValueChange={(next) => {
          // Radix는 값이 아직 그려지지 않은 항목을 가리키면 ''를 한 번 보낸다(내부 native select 동기화). 사용자 선택이 아니다
          if (next === '') return;
          setPickedArea(next);
          if (value !== undefined) onChange(undefined);
        }}
        disabled={regions.isPending}
      >
        <SelectTrigger
          id={id}
          className="h-9 w-32"
          aria-label={`${label} 권역`}
          aria-invalid={invalid ? true : undefined}
        >
          <SelectValue placeholder="권역" />
        </SelectTrigger>
        <SelectContent>
          {areasOf(all).map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.name}
              {hiddenSuffix(r.isActive)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={value ?? ''}
        onValueChange={(next) => {
          if (next !== '') onChange(next);
        }}
        disabled={!area && !unknown}
      >
        <SelectTrigger
          className="h-9 w-40"
          aria-label={`${label} 시·군·구`}
          aria-invalid={invalid ? true : undefined}
        >
          <SelectValue placeholder="시·군·구" />
        </SelectTrigger>
        <SelectContent>
          {unknown && <SelectItem value={value}>{`#${value}`}</SelectItem>}
          {districts.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.name}
              {hiddenSuffix(r.isActive)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {regions.isError && (
        <span role="alert" className="text-xs text-negative-foreground">
          지역 목록을 불러오지 못했습니다.
        </span>
      )}
      {value !== undefined && (
        <IconButton label={`${label} 선택 해제`} onClick={() => onChange(undefined)}>
          <XIcon />
        </IconButton>
      )}
    </span>
  );
}
