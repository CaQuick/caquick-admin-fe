import { useQueryClient } from '@tanstack/react-query';
import { GripVerticalIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { formatCount } from '@/shared/lib/format';
import { withJosa } from '@/shared/lib/josa';
import { formatKst } from '@/shared/lib/kst';
import { LIVE_STATUS, liveStatus } from '@/shared/lib/live-status';
import { cn } from '@/shared/lib/utils';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { IconButton } from '@/shared/ui/icon-button';
import { Skeleton } from '@/shared/ui/skeleton';
import { StatusPill } from '@/shared/ui/status-pill';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { searchChipMutations } from '../api/queries';
import { type Chip, chipSaveError, formatWindow } from '../schema';
import { ChipDialog } from './chip-dialog';

const HINT_ID = 'chip-reorder-hint';

interface Props {
  rows: Chip[];
  now: Date;
  isLoading: boolean;
  /** 순서 손잡이를 잠근다(저장 중) */
  reorderDisabled: boolean;
  /** 있으면 수정·삭제를 막고 이유를 툴팁으로 알린다 */
  editBlockedReason: string | undefined;
  /** from 자리의 칩을 to 자리로 옮긴다. 안내 문구는 표가 낸다 */
  onMove: (from: number, to: number) => void;
}

/** 칩 목록 표. 손잡이를 끌거나, 손잡이에 포커스를 두고 ↑↓로 순서를 바꾼다 */
export function ChipTable({
  rows,
  now,
  isLoading,
  reorderDisabled,
  editBlockedReason,
  onMove,
}: Props) {
  const qc = useQueryClient();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const handles = useRef(new Map<string, HTMLButtonElement>());
  const focusAfterMove = useRef<string | null>(null);

  // 키보드로 옮긴 뒤에도 같은 칩의 손잡이에 포커스를 둔다 — 이어서 ↑↓를 누를 수 있게
  useEffect(() => {
    const id = focusAfterMove.current;
    if (id === null) return;
    focusAfterMove.current = null;
    handles.current.get(id)?.focus();
  }, [rows]);

  const indexOf = (id: string) => rows.findIndex((r) => r.id === id);
  const move = (id: string, to: number) => {
    const from = indexOf(id);
    const chip = rows[from];
    if (!chip || to < 0 || to >= rows.length || from === to) return;
    onMove(from, to);
    setAnnouncement(
      `${withJosa(chip.keyword, '을/를')} 전체 ${formatCount(rows.length)}개 가운데 ${formatCount(to + 1)}번째로 옮겼습니다.`,
    );
  };

  const onHandleKey = (e: KeyboardEvent<HTMLButtonElement>, id: string) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    if (reorderDisabled) return;
    const from = indexOf(id);
    const to = e.key === 'ArrowUp' ? from - 1 : from + 1;
    if (to < 0 || to >= rows.length) {
      setAnnouncement(to < 0 ? '이미 맨 앞입니다.' : '이미 맨 뒤입니다.');
      return;
    }
    focusAfterMove.current = id;
    move(id, to);
  };

  const endDrag = () => {
    setDragId(null);
    setOverId(null);
  };
  const dragFrom = dragId === null ? -1 : indexOf(dragId);

  return (
    <>
      <Table className="min-w-[820px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-20 pl-5">순서</TableHead>
            <TableHead>키워드</TableHead>
            <TableHead>노출 상태</TableHead>
            <TableHead>노출 기간 (한국 시간)</TableHead>
            <TableHead>수정일</TableHead>
            <TableHead className="w-24 pr-5">
              <span className="sr-only">관리</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={`s-${i}`} aria-hidden>
                {Array.from({ length: 6 }).map((__, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full max-w-32" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                칩이 없습니다. &apos;칩 추가&apos;로 첫 칩을 만들어 주세요.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((chip, index) => {
              const s = LIVE_STATUS[liveStatus(chip, now)];
              const isOver = overId === chip.id && dragId !== chip.id;
              return (
                <TableRow
                  key={chip.id}
                  data-dragging={dragId === chip.id || undefined}
                  className={cn(
                    'data-[dragging]:opacity-50',
                    isOver && dragFrom < index && 'border-b-2 border-b-primary',
                    isOver && dragFrom > index && 'border-t-2 border-t-primary',
                  )}
                  onDragOver={(e) => {
                    if (dragId === null) return;
                    e.preventDefault();
                    setOverId(chip.id);
                  }}
                  onDrop={(e) => {
                    if (dragId === null) return;
                    e.preventDefault();
                    move(dragId, index);
                    endDrag();
                  }}
                >
                  <TableCell className="pl-5">
                    <span className="inline-flex items-center gap-2 text-muted-foreground tabular-nums">
                      <button
                        type="button"
                        ref={(el) => {
                          if (el) handles.current.set(chip.id, el);
                          else handles.current.delete(chip.id);
                        }}
                        draggable={!reorderDisabled}
                        aria-label={`${chip.keyword} 순서 바꾸기`}
                        aria-describedby={HINT_ID}
                        aria-disabled={reorderDisabled || undefined}
                        className="inline-flex size-7 cursor-grab items-center justify-center rounded-md hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                        onKeyDown={(e) => onHandleKey(e, chip.id)}
                        onDragStart={(e) => {
                          // 브라우저마다 dataTransfer가 비면 끌기가 시작되지 않는다(Firefox)
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', chip.id);
                          const tr = e.currentTarget.closest('tr');
                          if (tr) e.dataTransfer.setDragImage(tr, 16, 16);
                          setDragId(chip.id);
                        }}
                        onDragEnd={endDrag}
                      >
                        <GripVerticalIcon className="size-4" aria-hidden />
                      </button>
                      {formatCount(index + 1)}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold whitespace-nowrap">{chip.keyword}</TableCell>
                  <TableCell>
                    <StatusPill tone={s.tone}>{s.label}</StatusPill>
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {formatWindow(chip.startsAt, chip.endsAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">
                    {formatKst(chip.updatedAt, true)}
                  </TableCell>
                  <TableCell className="pr-5">
                    <div className="flex justify-end gap-1">
                      <ChipDialog
                        chip={chip}
                        trigger={
                          <IconButton
                            label={`${chip.keyword} 수정`}
                            disabledReason={editBlockedReason}
                          >
                            <PencilIcon />
                          </IconButton>
                        }
                      />
                      <ConfirmDialog
                        trigger={
                          <IconButton
                            label={`${chip.keyword} 삭제`}
                            disabledReason={editBlockedReason}
                            className="text-negative-foreground"
                          >
                            <Trash2Icon />
                          </IconButton>
                        }
                        title={`"${chip.keyword}" 칩을 삭제할까요?`}
                        description="삭제한 키워드로 다시 만들 수 있습니다."
                        confirmLabel="삭제"
                        destructive
                        onConfirm={async () => {
                          try {
                            await searchChipMutations.remove(qc, chip.id);
                            toast.success(`"${chip.keyword}" 칩을 삭제했습니다.`);
                          } catch (e) {
                            const r = chipSaveError(e);
                            toast.error(r.message);
                            if (r.notFound) {
                              // 이미 없는 칩이다 — 목록을 새로 받고 다이얼로그는 닫는다
                              await searchChipMutations.refresh(qc);
                              return;
                            }
                            throw e;
                          }
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      <p className="border-t px-5 py-3 text-xs text-muted-foreground">
        {!isLoading && `전체 ${formatCount(rows.length)}개 · `}
        <span id={HINT_ID}>손잡이를 끌거나, 손잡이에서 ↑↓ 키로 순서를 바꿉니다.</span>
      </p>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </>
  );
}
