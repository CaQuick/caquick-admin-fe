import { createFileRoute } from '@tanstack/react-router';

import { ReviewsPage, reviewsSearchSchema } from '@/features/reviews';

export const Route = createFileRoute('/_authed/_shell/reviews')({
  validateSearch: reviewsSearchSchema,
  component: ReviewsRoute,
});

function ReviewsRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return <ReviewsPage search={search} onSearchChange={(next) => void navigate({ search: next })} />;
}
