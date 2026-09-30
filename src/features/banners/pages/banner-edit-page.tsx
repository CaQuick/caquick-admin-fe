import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { HistoryIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';

import { bannerDetailQueryOptions, deleteBanner } from '../api/queries';
import { BannerForm } from '../components/banner-form';

export function BannerCreatePage() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader
        title="새 배너"
        back={{ to: '/banners' }}
        description="구매자 앱의 홈·검색 화면에 보일 배너를 등록합니다. 같은 자리에서는 정렬 순서가 가장 작은 배너 1개만 보입니다."
      />
      <BannerForm
        onSaved={(id) => {
          toast.success('배너를 등록했습니다.');
          void navigate({ to: '/banners/$bannerId', params: { bannerId: id }, replace: true });
        }}
      />
    </>
  );
}

export function BannerEditPage({ bannerId }: { bannerId: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const q = useQuery(bannerDetailQueryOptions(bannerId));
  if (q.isError) {
    return (
      <>
        <PageHeader title="배너" />
        <p role="alert" className="text-sm text-negative-foreground">
          {messageFor(q.error)}
        </p>
        <Button asChild variant="link" className="px-0">
          <Link to="/banners">목록으로</Link>
        </Button>
      </>
    );
  }
  if (!q.data) return <Skeleton className="h-64" aria-busy />;
  return (
    <>
      <PageHeader
        title={q.data.title ?? `배너 #${q.data.id}`}
        back={{ to: '/banners' }}
        description={`배너 ID ${q.data.id}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/audit-logs" search={{ targetType: 'BANNER', targetId: q.data.id }}>
                <HistoryIcon className="size-4" /> 감사 이력
              </Link>
            </Button>
            <ConfirmDialog
              trigger={
                <Button type="button" variant="outline" className="text-negative-foreground">
                  <Trash2Icon className="size-4" /> 삭제
                </Button>
              }
              title="배너를 삭제할까요?"
              description="구매자 화면에서 바로 사라지고 되돌릴 수 없습니다."
              confirmLabel="삭제"
              destructive
              onConfirm={async () => {
                try {
                  await deleteBanner(qc, bannerId);
                } catch (e) {
                  toast.error(messageFor(e));
                  throw e;
                }
                toast.success('배너를 삭제했습니다.');
                void navigate({ to: '/banners', replace: true });
              }}
            />
          </>
        }
      />
      <BannerForm
        key={q.data.updatedAt}
        banner={q.data}
        onSaved={() => toast.success('배너를 저장했습니다.')}
      />
    </>
  );
}
