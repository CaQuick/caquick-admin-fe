import { createFileRoute } from '@tanstack/react-router';

import { SellerCreatePage } from '@/features/sellers';

export const Route = createFileRoute('/_authed/_shell/sellers/new')({
  component: SellerCreatePage,
});
