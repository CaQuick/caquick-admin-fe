import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRightIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
import { formatCount } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { Label } from '@/shared/ui/label';
import { PageHeader } from '@/shared/ui/page-header';
import { StatusPill } from '@/shared/ui/status-pill';
import { Switch } from '@/shared/ui/switch';
import { cn } from '@/shared/lib/utils';

import { regionMutations, regionsQueryOptions } from '../api/queries';
import { RegionDialog } from '../components/region-dialog';
import { type Region, type RegionsSearch } from '../schema';

interface Props {
  search: RegionsSearch;
  onSearchChange: (next: RegionsSearch) => void;
}

function RegionRow({
  r,
  selected,
  onSelect,
  parent,
}: {
  r: Region;
  selected: boolean;
  onSelect?: () => void;
  parent: Region | null;
}) {
  const qc = useQueryClient();
  const linked = r.level === 2 ? r.storeCount : r.childCount;
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
          <span className="truncate font-medium">{r.name}</span>
          <span className="text-xs text-muted-foreground">{r.slug}</span>
          <ChevronRightIcon className="ml-auto size-4 text-muted-foreground" aria-hidden />
        </button>
      ) : (
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate font-medium">{r.name}</span>
          <span className="text-xs text-muted-foreground">{r.slug}</span>
        </span>
      )}
      {!r.isActive && <StatusPill tone="neutral">비활성</StatusPill>}
      <span className="w-16 text-right text-xs text-muted-foreground tabular-nums">
        {r.level === 2 ? `매장 ${formatCount(r.storeCount)}` : `하위 ${formatCount(r.childCount)}`}
      </span>
      <RegionDialog
        region={r}
        parent={parent}
        trigger={
          <Button variant="ghost" size="icon" className="size-7" aria-label={`${r.name} 수정`}>
            <PencilIcon className="size-3.5" />
          </Button>
        }
      />
      <ConfirmDialog
        trigger={
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-negative-foreground"
            aria-label={`${r.name} 삭제`}
            disabled={linked > 0}
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        }
        title={`${r.name} 지역을 삭제할까요?`}
        description={
          r.level === 2 ? '연결된 매장이 있으면 거절됩니다.' : '활성 하위 지역이 있으면 거절됩니다.'
        }
        confirmLabel="삭제"
        destructive
        onConfirm={async () => {
          try {
            await regionMutations.remove(qc, r.id);
            toast.success(`${r.name} 지역을 삭제했습니다.`);
          } catch (e) {
            toast.error(messageFor(e));
            throw e;
          }
        }}
      />
    </li>
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
  const level1 = roots.data?.filter((r) => r.level === 1) ?? [];

  return (
    <>
      <PageHeader
        title="지역"
        meta={roots.data ? `권역 ${formatCount(level1.length)}개` : undefined}
        description="1단계(권역) → 2단계(시·군·구). 매장은 2단계 지역에 연결됩니다."
        actions={
          <span className="flex items-center gap-2">
            <Switch
              id="rg-inactive"
              checked={includeInactive}
              onCheckedChange={(v) =>
                onSearchChange({ ...search, inactive: v ? 'true' : undefined })
              }
            />
            <Label htmlFor="rg-inactive" className="text-xs">
              비활성 포함
            </Label>
          </span>
        }
      />
      {roots.isError ? (
        <p role="alert" className="text-sm text-negative-foreground">
          {messageFor(roots.error)}
        </p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="gap-0 py-0">
            <CardHeader className="flex-row items-center border-b px-3 py-2.5">
              <CardTitle className="text-sm">1단계 권역</CardTitle>
              <RegionDialog
                parent={null}
                trigger={
                  <Button variant="outline" size="sm" className="ml-auto h-7">
                    <PlusIcon className="size-3.5" /> 권역 추가
                  </Button>
                }
              />
            </CardHeader>
            <CardContent className="p-0">
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
                    onSelect={() => onSearchChange({ ...search, parent: r.id })}
                  />
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="gap-0 py-0">
            <CardHeader className="flex-row items-center border-b px-3 py-2.5">
              <CardTitle className="text-sm">
                {parent ? `${parent.name} › 2단계` : '2단계 시·군·구'}
              </CardTitle>
              {parent?.isActive ? (
                <RegionDialog
                  parent={parent}
                  trigger={
                    <Button variant="outline" size="sm" className="ml-auto h-7">
                      <PlusIcon className="size-3.5" /> 하위 추가
                    </Button>
                  }
                />
              ) : (
                // BE가 비활성 부모 아래 생성을 거절한다(PARENT_REGION_INVALID)
                parent && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    비활성 권역에는 하위를 추가할 수 없습니다.
                  </span>
                )
              )}
            </CardHeader>
            <CardContent className="p-0">
              {!parent ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  왼쪽에서 권역을 고르세요.
                </p>
              ) : children.isError ? (
                <p role="alert" className="px-3 py-6 text-center text-sm text-negative-foreground">
                  {messageFor(children.error)}
                </p>
              ) : (
                <ul className="divide-y divide-divider">
                  {children.data?.length === 0 && (
                    <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                      하위 지역이 없습니다.
                    </li>
                  )}
                  {children.data?.map((r) => (
                    <RegionRow key={r.id} r={r} parent={parent} selected={false} />
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
