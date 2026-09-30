import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { HistoryIcon } from 'lucide-react';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
import { withJosa } from '@/shared/lib/josa';
import { formatKst } from '@/shared/lib/kst';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { PageHeader } from '@/shared/ui/page-header';
import { ReasonDialog } from '@/shared/ui/reason-dialog';
import { Skeleton } from '@/shared/ui/skeleton';
import { StatusPill } from '@/shared/ui/status-pill';

import { reportDetailQueryOptions, resolveReport } from '../api/queries';
import { Reporter } from '../components/reporter';
import { ReviewMediaList } from '../components/review-media';
import { ReviewLink } from '../components/review-sheet';
import { REPORT_REASON, REPORT_STATUS, TARGET_TYPE } from '../meta';

const linkClass = 'text-primary-soft-foreground hover:underline';

export function ReportDetailPage({ reportId }: { reportId: string }) {
  const qc = useQueryClient();
  const q = useQuery(reportDetailQueryOptions(reportId));
  const back = { to: '/reports' } as const;
  if (q.isError) {
    return (
      <>
        <PageHeader title="신고" back={back} />
        <p role="alert" className="text-sm text-negative-foreground">
          {messageFor(q.error)}
        </p>
      </>
    );
  }
  if (!q.data) return <Skeleton className="h-64" aria-busy />;
  const { report, target } = q.data;
  const status = REPORT_STATUS[report.status] ?? { label: report.status, tone: 'neutral' as const };
  const pending = report.status === 'PENDING';
  const targetLabel = TARGET_TYPE[report.targetType] ?? report.targetType;
  const isReview = report.targetType === 'REVIEW';
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
        back={back}
        meta={<StatusPill tone={status.tone}>{status.label}</StatusPill>}
        description={`${targetLabel} #${report.targetId} · 접수 ${formatKst(report.createdAt, true)}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/audit-logs" search={{ targetType: 'REVIEW_REPORT', targetId: report.id }}>
                <HistoryIcon className="size-4" /> 감사 이력
              </Link>
            </Button>
            {pending && (
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
                  title={`${withJosa(targetLabel, '을/를')} 삭제할까요?`}
                  description="대상을 삭제하고, 같은 대상에 대기 중인 신고를 모두 처리 완료(대상 삭제)로 닫습니다."
                  reasonLabel="메모"
                  reasonRequired={false}
                  confirmLabel="삭제"
                  destructive
                  onConfirm={act('DELETE_TARGET')}
                />
              </>
            )}
          </>
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
                <Reporter
                  accountId={report.reporterAccountId}
                  nickname={report.reporterNickname}
                  withdrawn={report.reporterWithdrawn}
                  className="text-primary-soft-foreground"
                />
              </dd>
              <dt className="text-muted-foreground">신고 시점 본문</dt>
              <dd className="rounded-md bg-surface-tint px-2 py-1 whitespace-pre-line">
                {report.contentSnapshot ?? '—'}
              </dd>
              {!pending && (
                <>
                  <dt className="text-muted-foreground">처리</dt>
                  <dd>
                    {report.resolvedAt ? formatKst(report.resolvedAt, true) : ''} · 처리자{' '}
                    {resolverName(report.resolvedByLabel, report.resolvedByAccountId)}
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
          <CardHeader className="flex items-center gap-2">
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
                  className={linkClass}
                >
                  {target.authorNickname ?? `#${target.authorAccountId}`}
                </Link>
              </dd>
              <dt className="text-muted-foreground">현재 본문</dt>
              <dd className="whitespace-pre-line">{target.content ?? '—'}</dd>
              {isReview && (
                <>
                  <dt className="text-muted-foreground">사진·동영상</dt>
                  <dd>
                    <ReviewMediaList media={target.media} />
                  </dd>
                </>
              )}
              <dt className="text-muted-foreground">매장</dt>
              <dd>
                <Link
                  to="/stores/$storeId"
                  params={{ storeId: target.storeId }}
                  className={linkClass}
                >
                  {target.storeName}
                </Link>
              </dd>
              <dt className="text-muted-foreground">{isReview ? '리뷰' : '상위 리뷰'}</dt>
              <dd>
                <ReviewLink reviewId={target.reviewId ?? target.id} className={linkClass} />
              </dd>
            </dl>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

/** 처리자 표시. 라벨이 없으면 ID, ID도 없으면 작성자 삭제 등으로 저절로 닫힌 신고다 */
function resolverName(label: string | null | undefined, accountId: string | null | undefined) {
  if (label != null) return label;
  return accountId != null ? `#${accountId}` : '없음(자동으로 닫힘)';
}
