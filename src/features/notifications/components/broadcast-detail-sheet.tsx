import { Link } from '@tanstack/react-router';
import { type ReactNode } from 'react';

import { messageFor } from '@/shared/api';
import { formatCount } from '@/shared/lib/format';
import { formatKst } from '@/shared/lib/kst';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { StatusPill } from '@/shared/ui/status-pill';

import { type Broadcast } from '../api/queries';
import { BROADCAST_STATUS, TARGET_KINDS, actorText, typeLabel } from '../meta';

interface Props {
  /** 열린 이력 ID. undefined면 닫힌다 */
  broadcastId: string | undefined;
  /** 읽어 온 이력. 없는 ID면 null */
  broadcast: Broadcast | null;
  /** 아직 읽는 중이면 '찾지 못함' 대신 기다린다 */
  isLoading: boolean;
  /** 읽기에 실패했으면 그 오류 */
  error: Error | null;
  onClose: () => void;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </>
  );
}

function IdList({ ids, linkToUser }: { ids: readonly string[]; linkToUser: boolean }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {ids.map((id) => (
        <li key={id} className="rounded-md border px-1.5 py-0.5 font-mono text-xs tabular-nums">
          {linkToUser ? (
            <Link
              to="/users/$accountId"
              params={{ accountId: id }}
              className="text-primary-soft-foreground hover:underline"
            >
              {id}
            </Link>
          ) : (
            id
          )}
        </li>
      ))}
    </ul>
  );
}

function Detail({ b }: { b: Broadcast }) {
  const status = BROADCAST_STATUS[b.status];
  const kind = TARGET_KINDS.find((k) => k.value === b.targetKind)?.label ?? b.targetKind;
  return (
    <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-6 text-sm">
      <section aria-label="본문">
        <p className="rounded-md bg-surface-tint px-3 py-2 break-words whitespace-pre-wrap">
          {b.body}
        </p>
      </section>
      <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-2 tabular-nums">
        <Row label="상태">
          <StatusPill tone={status.tone}>{status.label}</StatusPill>
          <p className="mt-1 text-xs text-muted-foreground">{status.help}</p>
        </Row>
        <Row label="유형">{typeLabel(b.type)}</Row>
        <Row label="대상">{kind}</Row>
        <Row label="대상 수">{formatCount(b.targetCount)}명</Row>
        <Row label="저장된 수">
          {formatCount(b.deliveredCount)}명
          <p className="mt-1 text-xs text-muted-foreground">
            보내는 사이 정지·탈퇴한 구매자는 빠지므로 대상 수보다 적을 수 있습니다.
          </p>
        </Row>
        <Row label="받지 못한 계정">
          {b.skippedCount === 0 ? '없음' : `${formatCount(b.skippedCount)}개(탈퇴·정지 등)`}
        </Row>
        <Row label="보낸 사람">{actorText(b.actorLabel, b.actorAccountId)}</Row>
        <Row label="요청 시각">{formatKst(b.requestedAt, true)}</Row>
        <Row label="완료 시각">
          {b.completedAt ? formatKst(b.completedAt, true) : '아직 끝나지 않았습니다.'}
        </Row>
      </dl>
      {b.targetKind === 'ACCOUNT_IDS' && (
        <section className="flex flex-col gap-2">
          <h3 className="text-[13px] font-semibold">
            대상 계정 ID {formatCount(b.targetAccountIds.length)}개
          </h3>
          {b.targetAccountIds.length === 0 ? (
            <p className="text-muted-foreground">없습니다.</p>
          ) : (
            <IdList ids={b.targetAccountIds} linkToUser />
          )}
        </section>
      )}
      {b.skippedAccountIds.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-[13px] font-semibold">
            받지 못한 계정 ID {formatCount(b.skippedAccountIds.length)}개
          </h3>
          <p className="text-xs text-muted-foreground">
            탈퇴·정지했거나 구매자 계정이 아니어서 대상에서 빠졌습니다.
          </p>
          <IdList ids={b.skippedAccountIds} linkToUser={false} />
        </section>
      )}
    </div>
  );
}

/** 발송 이력 1건의 상세. 주소(broadcastId)로 열려 새로고침·공유해도 같은 이력을 보인다 */
export function BroadcastDetailSheet({ broadcastId, broadcast, isLoading, error, onClose }: Props) {
  let description = '해당 발송 이력을 찾을 수 없습니다. 주소를 다시 확인해 주세요.';
  if (broadcast) description = `${formatKst(broadcast.requestedAt, true)} 요청`;
  else if (error) description = messageFor(error);
  else if (isLoading) description = '불러오고 있습니다.';
  return (
    <Sheet open={broadcastId !== undefined} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="pr-10">
          <SheetTitle className="break-words">
            {broadcast ? broadcast.title : '발송 이력'}
          </SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        {broadcast && <Detail b={broadcast} />}
      </SheetContent>
    </Sheet>
  );
}
