import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ChevronRightIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
import { formatCount } from '@/shared/lib/format';
import { withJosa } from '@/shared/lib/josa';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { FilterBar } from '@/shared/ui/filter-bar';
import { IconButton } from '@/shared/ui/icon-button';
import { Label } from '@/shared/ui/label';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';
import { StatusPill } from '@/shared/ui/status-pill';
import { Switch } from '@/shared/ui/switch';

import { allRegionsQueryOptions, regionMutations, regionsQueryOptions } from '../api/queries';
import { RegionDialog } from '../components/region-dialog';
import { blockingCount } from '../lookup';
import { type Region, type RegionsSearch } from '../schema';

interface Props {
  search: RegionsSearch;
  onSearchChange: (next: RegionsSearch) => void;
}

/** 삭제를 막는 이유. 막지 않으면 undefined */
function deleteBlockedReason(r: Region, count: number): string | undefined {
  if (count === 0) return undefined;
  return r.level === 2
    ? `연결된 매장이 ${formatCount(count)}곳 있어 삭제할 수 없습니다.`
    : `하위 지역이 ${formatCount(count)}곳(숨긴 지역 포함) 있어 삭제할 수 없습니다.`;
}

function RegionRow({
  r,
  selected,
  onSelect,
  parent,
  blocking,
}: {
  r: Region;
  selected: boolean;
  onSelect?: () => void;
  parent: Region | null;
  /** 삭제를 막는 연결 수. 모르면(전체 목록 로딩 중) undefined */
  blocking: number | undefined;
}) {
  const qc = useQueryClient();
  const name = (
    <>
      <span className="truncate font-medium">{r.name}</span>
      <span className="text-xs text-muted-foreground">{r.slug}</span>
    </>
  );
  return (
    <li
      className={cn('flex items-center gap-2 px-3 py-2 text-sm', selected && 'bg-sidebar-accent')}
    >
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-current={selected ? 'true' : undefined}
          aria-label={`${r.name} 선택`}
        >
          {name}
          <ChevronRightIcon className="ml-auto size-4 text-muted-foreground" aria-hidden />
        </button>
      ) : (
        <span className="flex min-w-0 flex-1 items-center gap-2">{name}</span>
      )}
      {!r.isActive && <StatusPill tone="neutral">숨김</StatusPill>}
      <span className="w-20 text-right text-xs text-muted-foreground tabular-nums">
        {r.level === 2 ? (
          <Link
            to="/stores"
            search={{ regionId: r.id }}
            className="hover:text-foreground hover:underline"
          >
            매장 {formatCount(r.storeCount)}곳
          </Link>
        ) : (
          `하위 ${formatCount(r.childCount)}곳`
        )}
      </span>
      <RegionDialog
        region={r}
        parent={parent}
        trigger={
          <IconButton label={`${r.name} 수정`} className="size-7">
            <PencilIcon className="size-3.5" />
          </IconButton>
        }
      />
      <ConfirmDialog
        trigger={
          <IconButton
            label={`${r.name} 삭제`}
            className="size-7 text-negative-foreground"
            disabled={blocking === undefined}
            disabledReason={deleteBlockedReason(r, blocking ?? 0)}
          >
            <Trash2Icon className="size-3.5" />
          </IconButton>
        }
        title={`${withJosa(r.name, '을/를')} 삭제할까요?`}
        description={
          r.level === 2
            ? '연결된 매장이 있으면 삭제할 수 없습니다.'
            : '하위 지역(숨긴 지역 포함)이 있으면 삭제할 수 없습니다.'
        }
        confirmLabel="삭제"
        destructive
        onConfirm={async () => {
          try {
            await regionMutations.remove(qc, r.id);
            toast.success(`${withJosa(r.name, '을/를')} 삭제했습니다.`);
          } catch (e) {
            toast.error(messageFor(e));
            throw e;
          }
        }}
      />
    </li>
  );
}

function RowsSkeleton() {
  return (
    <ul aria-busy className="divide-y divide-divider">
      {[0, 1, 2].map((i) => (
        <li key={i} className="px-3 py-2.5">
          <Skeleton className="h-4 w-2/3" />
        </li>
      ))}
    </ul>
  );
}

export function RegionsPage({ search, onSearchChange }: Props) {
  const includeInactive = search.inactive === 'true';
  const roots = useQuery(regionsQueryOptions({ parentId: null, includeInactive }));
  const parent = roots.data?.find((r) => r.id === search.parent && r.level === 1) ?? null;
  const children = useQuery({
    ...regionsQueryOptions({ parentId: parent?.id ?? '__none__', includeInactive }),
    enabled: parent !== null,
  });
  // 삭제 가능 여부는 숨긴 하위까지 센다(BE 규칙). 보기 필터와 무관하게 전체 목록으로 계산한다
  const all = useQuery(allRegionsQueryOptions());
  const blocking = (r: Region) => (all.data ? blockingCount(all.data, r) : undefined);
  const level1 = roots.data?.filter((r) => r.level === 1) ?? [];

  return (
    <>
      <PageHeader
        title="지역"
        meta={roots.data ? `권역 ${formatCount(level1.length)}곳` : undefined}
        description="권역 아래에 시·군·구를 둡니다. 매장은 시·군·구에 연결됩니다."
      />
      <Card className="mb-3 gap-0 py-0">
        <FilterBar
          trailing={
            <>
              <Switch
                id="rg-inactive"
                checked={includeInactive}
                onCheckedChange={(v) =>
                  onSearchChange({ ...search, inactive: v ? 'true' : undefined })
                }
              />
              <Label htmlFor="rg-inactive" className="text-xs">
                숨긴 지역 포함
              </Label>
            </>
          }
        />
      </Card>
      {roots.isError ? (
        <p role="alert" className="text-sm text-negative-foreground">
          {messageFor(roots.error)}
        </p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="gap-0 py-0">
            <CardHeader className="items-center border-b px-3 py-2.5 [.border-b]:pb-2.5">
              <CardTitle className="text-sm">권역</CardTitle>
              <CardAction className="self-center">
                <RegionDialog
                  parent={null}
                  trigger={
                    <Button variant="outline" size="sm" className="h-7">
                      <PlusIcon className="size-3.5" /> 권역 추가
                    </Button>
                  }
                />
              </CardAction>
            </CardHeader>
            <CardContent className="p-0">
              {roots.isPending ? (
                <RowsSkeleton />
              ) : (
                <ul className="divide-y divide-divider">
                  {level1.length === 0 && (
                    <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                      권역이 없습니다.
                    </li>
                  )}
                  {level1.map((r) => (
                    <RegionRow
                      key={r.id}
                      r={r}
                      parent={null}
                      selected={r.id === parent?.id}
                      blocking={blocking(r)}
                      onSelect={() => onSearchChange({ ...search, parent: r.id })}
                    />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card className="gap-0 py-0">
            <CardHeader className="items-center border-b px-3 py-2.5 [.border-b]:pb-2.5">
              <CardTitle className="text-sm">
                {parent ? `${parent.name} › 시·군·구` : '시·군·구'}
              </CardTitle>
              {parent?.isActive ? (
                <CardAction className="self-center">
                  <RegionDialog
                    parent={parent}
                    trigger={
                      <Button variant="outline" size="sm" className="h-7">
                        <PlusIcon className="size-3.5" /> 하위 추가
                      </Button>
                    }
                  />
                </CardAction>
              ) : (
                // BE가 숨긴 부모 아래 생성을 거절한다(PARENT_REGION_INVALID)
                parent && (
                  <CardAction className="self-center text-xs text-muted-foreground">
                    숨긴 권역에는 하위 지역을 추가할 수 없습니다.
                  </CardAction>
                )
              )}
            </CardHeader>
            <CardContent className="p-0">
              {!parent ? (
                roots.isPending ? (
                  <RowsSkeleton />
                ) : (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    권역을 선택해 주세요.
                  </p>
                )
              ) : children.isError ? (
                <p role="alert" className="px-3 py-6 text-center text-sm text-negative-foreground">
                  {messageFor(children.error)}
                </p>
              ) : children.isPending ? (
                <RowsSkeleton />
              ) : (
                <ul className="divide-y divide-divider">
                  {children.data.length === 0 && (
                    <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                      하위 지역이 없습니다.
                    </li>
                  )}
                  {children.data.map((r) => (
                    <RegionRow
                      key={r.id}
                      r={r}
                      parent={parent}
                      selected={false}
                      blocking={blocking(r)}
                    />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
