import { createFileRoute } from '@tanstack/react-router';

import { CommentsPage, commentsSearchSchema } from '@/features/reviews';

export const Route = createFileRoute('/_authed/_shell/review-comments')({
  validateSearch: commentsSearchSchema,
  component: CommentsRoute,
});

function CommentsRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <CommentsPage search={search} onSearchChange={(next) => void navigate({ search: next })} />
  );
}
