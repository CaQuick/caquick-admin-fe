import { createFileRoute } from '@tanstack/react-router';

import { TagsPage, tagsSearchSchema } from '@/features/taxonomy';

export const Route = createFileRoute('/_authed/_shell/tags')({
  validateSearch: tagsSearchSchema,
  component: TagsRoute,
});

function TagsRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return <TagsPage search={search} onSearchChange={(next) => void navigate({ search: next })} />;
}
