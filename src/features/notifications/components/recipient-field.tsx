import { XIcon } from 'lucide-react';
import { useId, useState } from 'react';

import { formatCount } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { EntityPicker } from '@/shared/ui/entity-picker';
import { IconButton } from '@/shared/ui/icon-button';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import { userOptionsQueryOptions } from '../api/queries';
import { MAX_TARGET_ACCOUNTS, parseAccountIds } from '../schema';

interface Props {
  value: string[];
  onChange: (ids: string[]) => void;
  error?: string;
}

/** 받을 구매자 여러 명. 이름으로 찾아 한 명씩 더하거나, 계정 ID 목록을 붙여 넣어 한꺼번에 더한다 */
export function RecipientField({ value, onChange, error }: Props) {
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [bulk, setBulk] = useState('');
  const [bulkError, setBulkError] = useState<string | null>(null);
  const bulkId = useId();

  const add = (ids: string[]) => onChange([...new Set([...value, ...ids])]);

  const addBulk = () => {
    const { ids, invalid } = parseAccountIds(bulk);
    if (invalid.length > 0) {
      setBulkError(
        `숫자로 된 계정 ID만 넣어 주세요. 확인이 필요한 값: ${invalid.slice(0, 5).join(', ')}${invalid.length > 5 ? ' 외' : ''}`,
      );
      return;
    }
    setBulkError(null);
    add(ids);
    setBulk('');
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">받을 구매자</span>
        <EntityPicker
          label="받을 구매자 추가"
          placeholder="구매자 찾기"
          value={undefined}
          onChange={(id, option) => {
            if (id === undefined) return;
            if (option) setLabels((prev) => ({ ...prev, [id]: option.label }));
            add([id]);
          }}
          searchQuery={userOptionsQueryOptions}
          clearable={false}
        />
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-[13px] text-muted-foreground">
          계정 ID로 한꺼번에 추가하기
        </summary>
        <div className="mt-2 flex flex-col gap-1.5">
          <Label htmlFor={bulkId}>계정 ID(쉼표나 줄바꿈으로 구분)</Label>
          <Textarea
            id={bulkId}
            rows={3}
            value={bulk}
            aria-invalid={bulkError !== null}
            onChange={(e) => setBulk(e.target.value)}
          />
          {bulkError && <p className="text-xs text-negative-foreground">{bulkError}</p>}
          <div>
            <Button type="button" variant="outline" size="sm" onClick={addBulk}>
              목록에 추가
            </Button>
          </div>
        </div>
      </details>
      <div className="flex flex-col gap-1.5">
        <p className={error ? 'text-xs text-negative-foreground' : 'text-xs text-muted-foreground'}>
          {error ??
            `${formatCount(value.length)}명을 골랐습니다. 한 번에 ${formatCount(MAX_TARGET_ACCOUNTS)}명까지 보낼 수 있습니다.`}
        </p>
        {value.length > 0 && (
          <ul aria-label="고른 구매자" className="flex flex-wrap gap-1.5">
            {value.map((id) => {
              const name = labels[id] ?? `#${id}`;
              return (
                <li
                  key={id}
                  className="flex items-center gap-0.5 rounded-full border bg-surface-tint py-0.5 pr-0.5 pl-2.5 text-xs"
                >
                  {name}
                  <IconButton
                    label={`${name} 빼기`}
                    size="icon-sm"
                    className="size-6"
                    onClick={() => onChange(value.filter((v) => v !== id))}
                  >
                    <XIcon className="size-3" />
                  </IconButton>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
