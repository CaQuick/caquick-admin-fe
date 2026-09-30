import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
import { formatCount } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { IconButton } from '@/shared/ui/icon-button';
import { Label } from '@/shared/ui/label';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';
import { StatusPill } from '@/shared/ui/status-pill';
import { Switch } from '@/shared/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import { categoriesQueryOptions, categoryMutations } from '../api/queries';
import { CategoryDialog } from '../components/category-dialog';
import { CATEGORY_TYPES, type CategoriesSearch, type CategoryType } from '../schemas';

const COLUMN_COUNT = 6;
const SKELETON_ROWS = 4;

interface Props {
  search: CategoriesSearch;
  onSearchChange: (next: CategoriesSearch) => void;
}

export function CategoriesPage({ search, onSearchChange }: Props) {
  const qc = useQueryClient();
  const type: CategoryType = search.type ?? 'EVENT';
  const includeInactive = search.inactive === 'true';
  const q = useQuery(categoriesQueryOptions({ categoryType: type, includeInactive }));
  const typeMeta = CATEGORY_TYPES.find((t) => t.value === type)!;
  return (
    <>
      <PageHeader
        title="카테고리"
        meta={q.data ? `${typeMeta.label} ${formatCount(q.data.length)}개` : undefined}
        description={typeMeta.help || undefined}
        actions={
          <CategoryDialog
            categoryType={type}
            trigger={
              <Button>
                <PlusIcon className="size-4" /> 카테고리 추가
              </Button>
            }
          />
        }
      />
      <Card className="gap-0 py-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-divider px-4 py-3">
          <Tabs
            value={type}
            onValueChange={(v) => onSearchChange({ ...search, type: v as CategoryType })}
          >
            <TabsList>
              {CATEGORY_TYPES.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="ml-auto flex items-center gap-2">
            <Switch
              id="cat-inactive"
              checked={includeInactive}
              onCheckedChange={(v) =>
                onSearchChange({ ...search, inactive: v ? 'true' : undefined })
              }
            />
            <Label htmlFor="cat-inactive" className="text-xs">
              숨김 포함
            </Label>
          </div>
        </div>
        {q.isError ? (
          <p role="alert" className="px-4 py-8 text-center text-sm text-negative-foreground">
            {messageFor(q.error)}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-right">순서</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">상품</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.isPending &&
                  Array.from({ length: SKELETON_ROWS }, (_, i) => (
                    <TableRow key={`s-${i}`} aria-hidden>
                      {Array.from({ length: COLUMN_COUNT }, (__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full max-w-40" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                {q.isSuccess && q.data.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={COLUMN_COUNT}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {typeMeta.label} 카테고리가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
                {q.data?.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-right tabular-nums">{c.sortOrder}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="max-w-80 truncate text-muted-foreground">
                      {c.description ?? '—'}
                    </TableCell>
                    <TableCell>
                      <StatusPill tone={c.isActive ? 'positive' : 'neutral'}>
                        {c.isActive ? '노출' : '숨김'}
                      </StatusPill>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCount(c.productCount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <CategoryDialog
                          categoryType={type}
                          category={c}
                          trigger={
                            <IconButton label={`${c.name} 수정`}>
                              <PencilIcon />
                            </IconButton>
                          }
                        />
                        <ConfirmDialog
                          trigger={
                            <IconButton
                              label={`${c.name} 삭제`}
                              className="text-negative-foreground"
                            >
                              <Trash2Icon />
                            </IconButton>
                          }
                          title={`${c.name} 카테고리를 삭제할까요?`}
                          description={`상품 ${formatCount(c.productCount)}개와의 연결이 끊깁니다. 같은 이름으로 다시 만들면 복구되지만 연결은 돌아오지 않습니다.`}
                          confirmLabel="삭제"
                          destructive
                          onConfirm={async () => {
                            try {
                              await categoryMutations.remove(qc, c.id);
                              toast.success(`${c.name} 카테고리를 삭제했습니다.`);
                            } catch (e) {
                              toast.error(messageFor(e));
                              throw e;
                            }
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </>
  );
}
