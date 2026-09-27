import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
import { formatKst } from '@/shared/lib/kst';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { PageHeader } from '@/shared/ui/page-header';
import { ReasonDialog } from '@/shared/ui/reason-dialog';
import { Skeleton } from '@/shared/ui/skeleton';
import { StatusPill } from '@/shared/ui/status-pill';

import { reportDetailQueryOptions, resolveReport } from '../api/queries';
import { REPORT_REASON, REPORT_STATUS, TARGET_TYPE } from '../meta';

export function ReportDetailPage({ reportId }: { reportId: string }) {
  const qc = useQueryClient();
  const q = useQuery(reportDetailQueryOptions(reportId));
  if (q.isError) {
    return (
      <>
        <PageHeader title="신고" />
        <p role="alert" className="text-sm text-negative-foreground">
          {messageFor(q.error)}
        </p>
        <Button asChild variant="link" className="px-0">
          <Link to="/reports">목록으로</Link>
        </Button>
      </>
    );
  }
  if (!q.data) return <Skeleton className="h-64" aria-busy />;
  const { report, target } = q.data;
  const status = REPORT_STATUS[report.status] ?? { label: report.status, tone: 'neutral' as const };
  const pending = report.status === 'PENDING';
  const act = (action: 'DELETE_TARGET' | 'REJECT') => async (note: string) => {
    try {
      await resolveReport(qc, { reportId: report.id, action, note: note || null });
      toast.success(
        action === 'DELETE_TARGET' ? '대상을 삭제하고 신고를 닫았습니다.' : '신고를 반려했습니다.',
      );
    } catch (e) {
      toast.error(messageFor(e));
      throw e;
    }
  };
  return (
    <>
      <PageHeader
        title={`신고 #${report.id}`}
        meta={<StatusPill tone={status.tone}>{status.label}</StatusPill>}
        description={`${TARGET_TYPE[report.targetType]} #${report.targetId} · 접수 ${formatKst(report.createdAt, true)}`}
        actions={
          pending ? (
            <>
              <ReasonDialog
                trigger={<Button variant="outline">반려</Button>}
                title="신고를 반려할까요?"
                description="대상은 그대로 두고 이 신고만 반려로 닫습니다."
                reasonLabel="메모"
                reasonRequired={false}
                confirmLabel="반려"
                onConfirm={act('REJECT')}
              />
              <ReasonDialog
                trigger={<Button variant="destructive">대상 삭제</Button>}
                title={`${TARGET_TYPE[report.targetType]}을 삭제할까요?`}
                description="대상을 삭제하고 같은 대상의 대기 중 신고를 모두 삭제됨으로 닫습니다."
                reasonLabel="메모"
                reasonRequired={false}
                confirmLabel="삭제"
                destructive
                onConfirm={act('DELETE_TARGET')}
              />
            </>
          ) : undefined
        }
      />
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">신고 내용</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">사유</dt>
              <dd>{REPORT_REASON[report.reason] ?? report.reason}</dd>
              <dt className="text-muted-foreground">상세</dt>
              <dd className="whitespace-pre-line">{report.detail ?? '—'}</dd>
              <dt className="text-muted-foreground">신고자</dt>
              <dd>
                <Link
                  to="/users/$accountId"
                  params={{ accountId: report.reporterAccountId }}
                  className="text-primary-soft-foreground hover:underline"
                >
                  #{report.reporterAccountId}
                </Link>
              </dd>
              <dt className="text-muted-foreground">신고 시점 본문</dt>
              <dd className="rounded-md bg-surface-tint px-2 py-1 whitespace-pre-line">
                {report.contentSnapshot ?? '—'}
              </dd>
              {!pending && (
                <>
                  <dt className="text-muted-foreground">처리</dt>
                  <dd>
                    {report.resolvedAt ? formatKst(report.resolvedAt, true) : ''} · 처리자 #
                    {report.resolvedByAccountId ?? '?'}
                    {report.resolutionNote && (
                      <span className="block text-xs text-muted-foreground">
                        {report.resolutionNote}
                      </span>
                    )}
                  </dd>
                </>
              )}
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <CardTitle className="text-sm">현재 대상</CardTitle>
            {target.deleted && <StatusPill tone="negative">삭제됨</StatusPill>}
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">작성자</dt>
              <dd>
                <Link
                  to="/users/$accountId"
                  params={{ accountId: target.authorAccountId }}
                  className="text-primary-soft-foreground hover:underline"
                >
                  {target.authorNickname ?? `#${target.authorAccountId}`}
                </Link>
              </dd>
              <dt className="text-muted-foreground">현재 본문</dt>
              <dd className="whitespace-pre-line">{target.content ?? '—'}</dd>
              <dt className="text-muted-foreground">매장</dt>
              <dd>
                <Link
                  to="/stores/$storeId"
                  params={{ storeId: target.storeId }}
                  className="text-primary-soft-foreground hover:underline"
                >
                  #{target.storeId}
                </Link>
              </dd>
              {target.reviewId && (
                <>
                  <dt className="text-muted-foreground">상위 리뷰</dt>
                  <dd>#{target.reviewId}</dd>
                </>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
