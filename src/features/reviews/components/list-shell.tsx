import { type ReactNode } from 'react';

import { Card } from '@/shared/ui/card';
import { CursorPager } from '@/shared/ui/cursor-pager';

interface Connection {
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string | null;
  items: unknown[];
}

interface Props {
  filters: ReactNode;
  data: Connection | undefined;
  isFetching: boolean;
  isError: boolean;
  errorMessage: string;
  /** 목록 검색 파라미터(커서·필터). 필터가 바뀌면 '이전' 스택을 비운다 */
  search: { cursor?: string; limit?: number };
  onCursor: (cursor: string | undefined) => void;
  children: ReactNode;
}

/** 리뷰·댓글·신고 목록의 공통 틀(필터 줄 + 표 + 커서). */
export function ListShell({
  filters,
  data,
  isFetching,
  isError,
  errorMessage,
  search,
  onCursor,
  children,
}: Props) {
  return (
    <Card className="gap-0 py-0">
      {filters}
      {isError ? (
        <p role="alert" className="px-4 py-8 text-center text-sm text-negative-foreground">
          {errorMessage}
        </p>
      ) : (
        children
      )}
      {data && (
        <CursorPager
          page={data}
          search={search}
          isFetching={isFetching}
          onCursorChange={onCursor}
        />
      )}
    </Card>
  );
}
