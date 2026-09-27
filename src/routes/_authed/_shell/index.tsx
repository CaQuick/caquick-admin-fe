import { createFileRoute } from '@tanstack/react-router';

import { EmptyState } from '@/shared/ui/empty-state';
import { PageHeader } from '@/shared/ui/page-header';

export const Route = createFileRoute('/_authed/_shell/')({ component: Home });

function Home() {
  return (
    <>
      <PageHeader
        title="대시보드"
        description="KPI·주문 상태·검색어 순위는 이어지는 PR에서 붙는다."
      />
      <EmptyState
        title="아직 표시할 지표가 없습니다"
        description="대시보드 PR이 머지되면 여기에 요약이 나타납니다."
      />
    </>
  );
}
