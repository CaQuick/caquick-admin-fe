import { formatCount } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

import { type KeywordSnapshot } from './types';

export function KeywordRanking({ snapshot }: { snapshot: KeywordSnapshot }) {
  return (
    <Card>
      <CardHeader className="flex-row items-baseline gap-2">
        <CardTitle className="text-sm">검색어 순위</CardTitle>
        <span className="text-xs text-muted-foreground">
          {snapshot.rankedAt ? `${formatKst(snapshot.rankedAt)} 스냅샷` : '스냅샷 없음'}
        </span>
      </CardHeader>
      <CardContent>
        {snapshot.items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            아직 집계된 검색어가 없습니다.
          </p>
        ) : (
          <ol className="divide-y divide-divider">
            {snapshot.items.map((it) => (
              <li
                key={it.rank}
                className="grid grid-cols-[24px_1fr_auto] items-center gap-2.5 py-1.5 text-sm"
              >
                <span
                  className={
                    it.rank <= 3
                      ? 'text-xs font-bold text-primary-soft-foreground tabular-nums'
                      : 'text-xs text-muted-foreground tabular-nums'
                  }
                >
                  {it.rank}
                </span>
                <span className="truncate">{it.keyword}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatCount(it.searchCount)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
