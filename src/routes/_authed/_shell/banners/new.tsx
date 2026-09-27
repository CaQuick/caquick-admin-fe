import { createFileRoute } from '@tanstack/react-router';

import { BannerCreatePage } from '@/features/banners';

export const Route = createFileRoute('/_authed/_shell/banners/new')({
  component: BannerCreatePage,
});
