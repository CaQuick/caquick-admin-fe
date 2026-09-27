import { createFileRoute } from '@tanstack/react-router';

import { BannerEditPage } from '@/features/banners';

export const Route = createFileRoute('/_authed/_shell/banners/$bannerId')({
  component: BannerEditRoute,
});

function BannerEditRoute() {
  const { bannerId } = Route.useParams();
  return <BannerEditPage bannerId={bannerId} />;
}
