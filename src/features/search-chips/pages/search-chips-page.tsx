import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
import { useLiveNow } from '@/shared/hooks/use-live-now';
import { liveStatus } from '@/shared/lib/live-status';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { PageHeader } from '@/shared/ui/page-header';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';

import { searchChipMutations, searchChipsQueryOptions } from '../api/queries';
import { ChipDialog } from '../components/chip-dialog';
import { ChipTable } from '../components/chip-table';
import {
  CHIP_MESSAGES,
  type Chip,
  applyOrder,
  isReorderConflict,
  moveItem,
  sameOrder,
} from '../schema';

/** 순서를 바꾼 채 추가·수정·삭제하면 저장할 순서와 서버 목록이 어긋난다 — 먼저 정리하게 막는다 */
const BLOCKED_BY_ORDER = '바꾼 순서를 저장하거나 되돌린 뒤에 할 수 있습니다.';

export function SearchChipsPage() {
  const qc = useQueryClient();
  const list = useQuery(searchChipsQueryOptions());
  const saved = list.data ?? [];
  const savedIds = saved.map((c) => c.id);
  /** 저장 전 순서(칩 ID). null이면 서버 순서 그대로 */
  const [order, setOrder] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const rows = applyOrder(saved, order);
  const dirty =
    order !== null &&
    !sameOrder(
      rows.map((c) => c.id),
      savedIds,
    );
  const now = useLiveNow(saved);

  const move = (from: number, to: number) => {
    const next = moveItem(
      rows.map((c) => c.id),
      from,
      to,
    );
    setOrder(sameOrder(next, savedIds) ? null : next);
  };
  const revert = () => {
    setOrder(null);
    setConflict(false);
  };
  const save = async () => {
    setSaving(true);
    setConflict(false);
    try {
      await searchChipMutations.reorder(
        qc,
        rows.map((c) => c.id),
      );
      setOrder(null);
      toast.success('순서를 저장했습니다. 구매자 앱에 바로 반영됩니다.');
    } catch (e) {
      if (isReorderConflict(e)) setConflict(true);
      else toast.error(messageFor(e));
    } finally {
      setSaving(false);
    }
  };
  const reload = async () => {
    revert();
    await searchChipMutations.refresh(qc);
  };

  return (
    <>
      <PageHeader
        title="검색 칩"
        description="구매자 앱 검색 화면의 '인기 검색어' 아래에 보이는 바로가기 칩입니다. 누르면 그 키워드로 검색합니다. '급상승' 칩은 앱이 늘 맨 앞에 보여 주므로 여기서 관리하지 않습니다."
        actions={
          dirty ? (
            <BlockedButton reason={BLOCKED_BY_ORDER}>
              <PlusIcon className="size-4" /> 칩 추가
            </BlockedButton>
          ) : (
            <ChipDialog
              trigger={
                <Button type="button">
                  <PlusIcon className="size-4" /> 칩 추가
                </Button>
              }
            />
          )
        }
      />
      <div className="flex flex-col gap-4">
        <BuyerPreview
          chips={saved.filter((c) => liveStatus(c, now) === 'LIVE')}
          loaded={list.isSuccess}
        />
        <Card className="gap-0 overflow-hidden py-0">
          {dirty && (
            <div className="flex flex-wrap items-center gap-2 border-b bg-primary-soft px-5 py-3 text-sm text-primary-soft-foreground">
              <span className="font-semibold">순서를 바꿨습니다.</span>
              <span>저장해야 구매자 앱에 반영됩니다.</span>
              <span className="ml-auto flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={revert}
                  disabled={saving}
                >
                  되돌리기
                </Button>
                <Button type="button" size="sm" onClick={save} disabled={saving}>
                  {saving ? '저장 중…' : '순서 저장'}
                </Button>
              </span>
            </div>
          )}
          {list.isError ? (
            <p role="alert" className="px-4 py-8 text-center text-sm text-negative-foreground">
              {messageFor(list.error)}
            </p>
          ) : (
            <ChipTable
              rows={rows}
              now={now}
              isLoading={list.isPending}
              reorderDisabled={saving}
              editBlockedReason={dirty ? BLOCKED_BY_ORDER : undefined}
              onMove={move}
            />
          )}
        </Card>
        {conflict && (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-2 rounded-lg border border-negative/30 bg-negative-soft px-4 py-3 text-sm text-negative-foreground"
          >
            <span>{CHIP_MESSAGES.reorderConflict}</span>
            <Button type="button" variant="outline" size="sm" className="ml-auto" onClick={reload}>
              목록 새로 불러오기
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

/** 지금 구매자 앱에 보이는 칩. 저장된 순서 기준이라 저장 전 순서는 반영하지 않는다 */
function BuyerPreview({ chips, loaded }: { chips: Chip[]; loaded: boolean }) {
  return (
    <Card className="gap-3 px-5 py-4" role="region" aria-label="구매자 앱 미리보기">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">지금 구매자 앱에 보이는 순서</span>
        <span className="text-xs text-muted-foreground">
          노출 중인 칩만 저장된 순서대로 보입니다.
        </span>
      </div>
      <ol className="flex flex-wrap gap-2 text-[13px]">
        <li className="rounded-full bg-surface-tint px-3 py-1.5 text-muted-foreground">
          급상승 · 고정
        </li>
        {chips.map((c) => (
          <li key={c.id} className="rounded-full border px-3 py-1.5">
            {c.keyword}
          </li>
        ))}
      </ol>
      {loaded && chips.length === 0 && (
        <p className="text-xs text-muted-foreground">지금 노출 중인 칩이 없습니다.</p>
      )}
    </Card>
  );
}

/** 누를 수 없는 이유를 툴팁·설명으로 알리는 버튼. disabled는 포커스·호버를 막아 이유를 볼 수 없다 */
function BlockedButton({ reason, children }: { reason: string; children: ReactNode }) {
  const reasonId = useId();
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            aria-disabled
            aria-describedby={reasonId}
            className="cursor-not-allowed opacity-50"
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{reason}</TooltipContent>
      </Tooltip>
      <span id={reasonId} className="sr-only">
        {reason}
      </span>
    </TooltipProvider>
  );
}
