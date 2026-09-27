import { CodeIcon } from 'lucide-react';

import { type AdminAuditLogsQuery } from '@/graphql/generated/graphql';
import { formatKst } from '@/shared/lib/kst';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';

import { actionMeta, prettyJson, targetLabel } from '../meta';

export type AuditRow = AdminAuditLogsQuery['adminAuditLogs']['items'][number];

export function DiffDialog({ log }: { log: AuditRow }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label={`로그 ${log.id} 상세`}>
          <CodeIcon className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {targetLabel(log.targetType)} #{log.targetId} · {actionMeta(log.action).label}
          </DialogTitle>
          <DialogDescription>
            {formatKst(log.createdAt, true)} · 행위자 #{log.actorAccountId}(
            {log.actorAccountType ?? '삭제됨'}) · IP {log.ipAddress ?? '—'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 md:grid-cols-2">
          <section>
            <h3 className="mb-1 text-xs font-medium text-muted-foreground">변경 전</h3>
            <pre className="max-h-96 overflow-auto rounded-md border bg-surface-tint p-2 font-mono text-xs whitespace-pre-wrap">
              {prettyJson(log.beforeJson) || '—'}
            </pre>
          </section>
          <section>
            <h3 className="mb-1 text-xs font-medium text-muted-foreground">변경 후</h3>
            <pre className="max-h-96 overflow-auto rounded-md border bg-surface-tint p-2 font-mono text-xs whitespace-pre-wrap">
              {prettyJson(log.afterJson) || '—'}
            </pre>
          </section>
        </div>
        {log.userAgent && (
          <p className="truncate text-[11px] text-muted-foreground">{log.userAgent}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
