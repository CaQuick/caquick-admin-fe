import { Link } from '@tanstack/react-router';

import { CATEGORY_TYPES } from '@/features/taxonomy';
import { type AdminProductQuery } from '@/graphql/generated/graphql';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { StatusPill } from '@/shared/ui/status-pill';

type Detail = AdminProductQuery['adminProduct'];

/** 판매자가 연결한 카테고리(유형별)와 태그. 누르면 해당 관리 화면으로 간다 */
export function ProductTaxonomyCard({ categories, tags }: Pick<Detail, 'categories' | 'tags'>) {
  const groups = CATEGORY_TYPES.map((t) => ({
    ...t,
    items: categories.filter((c) => c.categoryType === t.value),
  })).filter((g) => g.items.length > 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">분류</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-[88px_1fr] gap-x-3 gap-y-2 text-sm">
          {groups.length === 0 ? (
            <>
              <dt className="text-muted-foreground">카테고리</dt>
              <dd className="text-muted-foreground">없음</dd>
            </>
          ) : (
            groups.map((g) => (
              <div key={g.value} className="contents">
                <dt className="text-muted-foreground">{g.label}</dt>
                <dd>
                  <ul className="flex flex-wrap gap-1.5">
                    {g.items.map((c) => (
                      <li key={c.id} className="flex items-center gap-1">
                        <Badge asChild variant="outline">
                          <Link
                            to="/categories"
                            search={{
                              type: c.categoryType,
                              // 숨긴 카테고리는 기본 목록에 없다
                              inactive: c.isActive ? undefined : 'true',
                            }}
                          >
                            {c.name}
                          </Link>
                        </Badge>
                        {!c.isActive && <StatusPill tone="neutral">숨김</StatusPill>}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))
          )}
          <dt className="text-muted-foreground">태그</dt>
          <dd>
            {tags.length === 0 ? (
              <span className="text-muted-foreground">없음</span>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <li key={t.id}>
                    <Badge asChild variant="outline">
                      <Link to="/tags" search={{ q: t.name }}>
                        {t.name}
                      </Link>
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </dl>
      </CardContent>
    </Card>
  );
}
