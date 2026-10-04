import { createFileRoute } from '@tanstack/react-router';

import { SearchChipsPage } from '@/features/search-chips';

export const Route = createFileRoute('/_authed/_shell/search-chips')({
  component: SearchChipsPage,
});
