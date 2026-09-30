import { useState } from 'react';

import { formatYmd } from '@/shared/lib/kst';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import {
  PRESETS,
  PRESET_LABEL,
  type PeriodSearch,
  type Preset,
  type ResolvedPeriod,
} from '../period';

interface Props {
  period: ResolvedPeriod;
  onChange: (next: PeriodSearch) => void;
}

export function PeriodPicker({ period, onChange }: Props) {
  const [from, setFrom] = useState(formatYmd(period.fromDate));
  const [to, setTo] = useState(formatYmd(period.toDate));
  const pick = (preset: Preset) => {
    if (preset === 'custom') onChange({ period: 'custom', from, to });
    else onChange({ period: preset });
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="group" aria-label="기간" className="inline-flex overflow-hidden rounded-lg border">
        {PRESETS.map((p) => (
          <Button
            key={p}
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={period.preset === p}
            onClick={() => pick(p)}
            className="h-8 rounded-none border-l px-3 first:border-l-0 aria-pressed:bg-primary-soft aria-pressed:font-semibold aria-pressed:text-primary-soft-foreground"
          >
            {PRESET_LABEL[p]}
          </Button>
        ))}
      </div>
      {period.preset === 'custom' && (
        <form
          className="flex items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            onChange({ period: 'custom', from, to });
          }}
        >
          <Input
            type="date"
            aria-label="시작일"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-8 w-36"
          />
          <span className="text-xs text-muted-foreground">~</span>
          <Input
            type="date"
            aria-label="종료일"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 w-36"
          />
          <Button type="submit" size="sm" variant="outline" className="h-8">
            적용
          </Button>
        </form>
      )}
      <span className="text-xs text-muted-foreground">한국 시간 기준</span>
    </div>
  );
}
