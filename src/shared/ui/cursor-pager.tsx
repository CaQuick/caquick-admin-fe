import { ChevronRightIcon, RotateCcwIcon } from 'lucide-react';

import { formatCount } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';

interface Props {
  totalCount: number;
  shown: number;
  hasMore: boolean;
  /** 현재 커서가 있으면(첫 페이지가 아니면) 처음으로 버튼을 보인다 */
  atStart: boolean;
  onNext: () => void;
  onReset: () => void;
  isFetching?: boolean;
}

/** 키셋 커서 페이지네이션 — 이전 페이지 커서를 서버가 주지 않으므로 다음/처음만 둔다. 뒤로가기는 브라우저 히스토리가 맡는다. */
export function CursorPager({
  totalCount,
  shown,
  hasMore,
  atStart,
  onNext,
  onReset,
  isFetching = false,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground">
      <span className="tabular-nums">
        전체 {formatCount(totalCount)}건 중 {formatCount(shown)}건 표시
      </span>
      <div className="ml-auto flex gap-1.5">
        {!atStart && (
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={onReset}
            disabled={isFetching}
          >
            <RotateCcwIcon className="size-3.5" /> 처음
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-7"
          onClick={onNext}
          disabled={!hasMore || isFetching}
        >
          다음 <ChevronRightIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
