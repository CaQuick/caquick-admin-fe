import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';

import { bannerDetailQueryOptions } from '../api/queries';
import { BannerForm } from '../components/banner-form';

export function BannerCreatePage() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader
        title="새 배너"
        description="유형에 맞는 링크 필드 하나만 보냅니다. 카테고리 배치는 이벤트 카테고리 링크가 필수입니다."
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
        description={`배너 ID ${q.data.id}`}
      />
      <BannerForm
        key={q.data.updatedAt}
        banner={q.data}
        onSaved={() => toast.success('배너를 저장했습니다.')}
      />
    </>
  );
}
