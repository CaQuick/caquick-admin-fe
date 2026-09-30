import { type AdminAuditLogsQuery } from '@/graphql/generated/graphql';
import { formatKst } from '@/shared/lib/kst';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';

import { actionMeta, actorTypeLabel, diffRows, prettyJson, targetLabel } from '../meta';

export type AuditRow = AdminAuditLogsQuery['adminAuditLogs']['items'][number];

function RawJson({ log }: { log: AuditRow }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {(
        [
          ['변경 전', log.beforeJson],
          ['변경 후', log.afterJson],
        ] as const
      ).map(([title, raw]) => (
        <section key={title}>
          <h3 className="mb-1 text-xs font-medium text-muted-foreground">{title}</h3>
          <pre className="max-h-96 overflow-auto rounded-md border bg-surface-tint p-2 font-mono text-xs whitespace-pre-wrap">
            {prettyJson(raw) || '—'}
          </pre>
        </section>
      ))}
    </div>
  );
}

export function DiffDialog({ log }: { log: AuditRow }) {
  const rows = diffRows(log.beforeJson, log.afterJson);
  const actor = log.actorLabel ?? `#${log.actorAccountId}`;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7" aria-label={`로그 ${log.id} 상세`}>
          상세
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {targetLabel(log.targetType)} #{log.targetId} · {actionMeta(log.action).label}
          </DialogTitle>
          <DialogDescription>
            {formatKst(log.createdAt, true)} · 작업자 {actor}({actorTypeLabel(log.actorAccountType)}
            ) · IP {log.ipAddress ?? '—'}
          </DialogDescription>
        </DialogHeader>
        {rows === null ? (
          <RawJson log={log} />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-1.5 pr-3 font-medium">항목</th>
                  <th className="py-1.5 pr-3 font-medium">변경 전</th>
                  <th className="py-1.5 font-medium">변경 후</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.key}
                    className={cn('border-b align-top', r.changed && 'bg-primary-soft')}
                  >
                    <th
                      scope="row"
                      className="py-1.5 pr-3 text-left font-normal text-muted-foreground"
                    >
                      {r.label}
                      {r.changed && <span className="sr-only">(바뀜)</span>}
                    </th>
                    <td className="py-1.5 pr-3 break-all">{r.before}</td>
                    <td className="py-1.5 break-all">{r.after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <details>
              <summary className="cursor-pointer text-xs text-muted-foreground">
                기록 원문 보기
              </summary>
              <div className="mt-2">
                <RawJson log={log} />
              </div>
            </details>
          </>
        )}
        {log.userAgent && (
          <p className="truncate text-[11px] text-muted-foreground">{log.userAgent}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
