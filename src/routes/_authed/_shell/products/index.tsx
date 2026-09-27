import { createFileRoute } from '@tanstack/react-router';

import { ProductsListPage, productsSearchSchema } from '@/features/products';

export const Route = createFileRoute('/_authed/_shell/products/')({
  validateSearch: productsSearchSchema,
  component: ProductsRoute,
});

function ProductsRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <ProductsListPage search={search} onSearchChange={(next) => void navigate({ search: next })} />
  );
}
