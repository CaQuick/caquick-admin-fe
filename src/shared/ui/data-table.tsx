import {
  type ColumnDef,
  type RowData,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

// 컬럼 meta에 정렬 방향을 둔다 — 숫자 컬럼은 오른쪽 정렬 + tabular-nums
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'right';
  }
}

import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

interface Props<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  getRowId: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  /** 로딩 중 스켈레톤 행 수 */
  skeletonRows?: number;
}

/** 관리자 목록 표. 정렬·필터는 서버가 하므로 여기서는 렌더만(헤드리스 TanStack Table). */
export function DataTable<T>({
  columns,
  data,
  getRowId,
  isLoading = false,
  emptyMessage = '데이터가 없습니다.',
  onRowClick,
  skeletonRows = 5,
}: Props<T>) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel(), getRowId });
  const colCount = columns.length;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead
                  key={h.id}
                  className={cn(
                    'whitespace-nowrap',
                    h.column.columnDef.meta?.align === 'right' && 'text-right',
                  )}
                >
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <TableRow key={`s-${i}`} aria-hidden>
                {Array.from({ length: colCount }).map((__, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full max-w-40" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colCount} className="h-24 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                className={cn(onRowClick && 'cursor-pointer')}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      'whitespace-nowrap',
                      cell.column.columnDef.meta?.align === 'right' && 'text-right tabular-nums',
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
