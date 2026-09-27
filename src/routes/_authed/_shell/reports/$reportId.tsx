import { createFileRoute } from '@tanstack/react-router';

import { ReportDetailPage } from '@/features/reviews';

export const Route = createFileRoute('/_authed/_shell/reports/$reportId')({
  component: ReportDetailRoute,
});

function ReportDetailRoute() {
  const { reportId } = Route.useParams();
  return <ReportDetailPage reportId={reportId} />;
}
