import { createFileRoute } from '@tanstack/react-router';

import { CategoriesPage, categoriesSearchSchema } from '@/features/taxonomy';

export const Route = createFileRoute('/_authed/_shell/categories')({
  validateSearch: categoriesSearchSchema,
  component: CategoriesRoute,
});

function CategoriesRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <CategoriesPage
      search={search}
      onSearchChange={(next) => void navigate({ search: next, replace: true })}
    />
  );
}
