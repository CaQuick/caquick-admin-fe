import { SearchIcon, XIcon } from 'lucide-react';
import { Fragment, type FormEvent, type ReactNode, useState } from 'react';

import { MAX_KEYWORD_LENGTH } from '@/shared/lib/list-search';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

interface Props {
  /** 키워드 입력의 현재 값(URL 기준). undefined면 검색창을 두지 않는다 */
  keyword?: string;
  keywordPlaceholder?: string;
  onKeywordSubmit?: (keyword: string) => void;
  /** Select·날짜 등 추가 필터 */
  children?: ReactNode;
  /** 필터가 하나라도 걸려 있으면 초기화 버튼을 보인다 */
  hasActiveFilters: boolean;
  onReset: () => void;
}

/** 목록 상단 필터 줄. 값은 전부 URL 검색 파라미터가 정본이고, 여기서는 제출만 한다. */
export function FilterBar({
  keyword,
  keywordPlaceholder,
  onKeywordSubmit,
  children,
  hasActiveFilters,
  onReset,
}: Props) {
  // 초기화는 URL 값이 그대로인 입력(미커밋 초안·검증 오류)까지 비워야 한다 — 입력들을 새로 마운트한다
  const [resetCount, setResetCount] = useState(0);
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-divider px-4 py-3">
      {keyword !== undefined && onKeywordSubmit && (
        <form
          className="relative min-w-0 flex-1 basis-56"
          onSubmit={(e) => {
            e.preventDefault();
            const value = new FormData(e.currentTarget).get('keyword');
            onKeywordSubmit(typeof value === 'string' ? value.trim() : '');
          }}
        >
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            key={`${resetCount}:${keyword}`}
            name="keyword"
            defaultValue={keyword}
            placeholder={keywordPlaceholder}
            aria-label="검색어"
            className="h-9 pl-8"
            onInput={clampKeyword}
          />
        </form>
      )}
      <Fragment key={resetCount}>{children}</Fragment>
      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9"
          onClick={() => {
            setResetCount((c) => c + 1);
            onReset();
          }}
        >
          <XIcon className="size-3.5" /> 초기화
        </Button>
      )}
    </div>
  );
}

/** maxLength는 UTF-16 단위라 이모지를 2자로 센다 — BE·keywordText와 같은 코드 포인트 기준으로 자른다. */
function clampKeyword(e: FormEvent<HTMLInputElement>) {
  const input = e.currentTarget;
  const chars = [...input.value];
  if (chars.length > MAX_KEYWORD_LENGTH) input.value = chars.slice(0, MAX_KEYWORD_LENGTH).join('');
}
