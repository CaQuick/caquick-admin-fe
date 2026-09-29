import { ChevronLeftIcon, ChevronRightIcon, RotateCcwIcon } from 'lucide-react';
import { useState } from 'react';

import { formatCount } from '@/shared/lib/format';
import { DEFAULT_LIMIT } from '@/shared/lib/list-search';
import { Button } from '@/shared/ui/button';

interface Page {
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string | null;
  items: readonly unknown[];
}

/** 목록 검색 파라미터. cursor 말고 나머지(limit 포함)는 목록 조건으로 본다 */
type ListSearch = { cursor?: string; limit?: number } & object;

interface Props {
  page: Page;
  search: ListSearch;
  onCursorChange: (cursor: string | undefined) => void;
  isFetching?: boolean;
}

/** 커서를 뺀 목록 조건. 이 값이 바뀌면 지나온 커서는 다른 목록의 것이다 */
function filterKeyOf(search: ListSearch): string {
  return JSON.stringify(
    Object.entries(search)
      .filter(([k, v]) => k !== 'cursor' && v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

interface Trail {
  filterKey: string;
  /** 이 화면에서 지나온 커서 순서. undefined는 첫 페이지 */
  cursors: (string | undefined)[];
}

/**
 * 키셋 커서 페이지네이션. 서버는 다음 커서만 주므로 지나온 커서를 여기서 쌓아 '이전'을 만든다.
 * 브라우저 뒤로가기로 커서가 바뀌어도 쌓인 순서에서 위치를 찾는다. 목록 조건이 바뀌면 처음부터 다시 쌓는다.
 * 주소로 중간 페이지에 바로 들어오면 앞 페이지를 알 수 없어 '처음'만 둔다.
 */
export function CursorPager({ page, search, onCursorChange, isFetching = false }: Props) {
  const cursor = search.cursor;
  const filterKey = filterKeyOf(search);
  const [trail, setTrail] = useState<Trail>({ filterKey, cursors: [cursor] });

  let current = trail;
  if (trail.filterKey !== filterKey || !trail.cursors.includes(cursor)) {
    // 렌더 중 상태 보정(React의 이전 props 기반 상태 갱신 패턴). 다음 렌더에서는 조건이 거짓이다
    current = { filterKey, cursors: [cursor] };
    setTrail(current);
  }
  const index = current.cursors.indexOf(cursor);
  const prevCursor = index > 0 ? current.cursors[index - 1] : null;
  // 첫 페이지부터 쌓은 경우에만 몇 번째 구간인지 안다
  const offset = current.cursors[0] === undefined ? index * (search.limit ?? DEFAULT_LIMIT) : null;
  const shown = page.items.length;
  const total = formatCount(page.totalCount);

  const goNext = () => {
    if (!page.nextCursor) return;
    setTrail({ filterKey, cursors: [...current.cursors.slice(0, index + 1), page.nextCursor] });
    onCursorChange(page.nextCursor);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground">
      <span className="tabular-nums">
        {offset === null || shown === 0
          ? `전체 ${total}건 중 ${formatCount(shown)}건 표시`
          : `${formatCount(offset + 1)}–${formatCount(offset + shown)} / 전체 ${total}건`}
      </span>
      <div className="ml-auto flex gap-1.5">
        {cursor !== undefined && (
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={() => onCursorChange(undefined)}
            disabled={isFetching}
          >
            <RotateCcwIcon className="size-3.5" /> 처음
          </Button>
        )}
        {prevCursor !== null && (
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={() => onCursorChange(prevCursor)}
            disabled={isFetching}
          >
            <ChevronLeftIcon className="size-3.5" /> 이전
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-7"
          onClick={goNext}
          disabled={!page.hasMore || !page.nextCursor || isFetching}
        >
          다음 <ChevronRightIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
