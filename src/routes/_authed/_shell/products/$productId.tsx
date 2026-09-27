import { createFileRoute } from '@tanstack/react-router';

import { ProductDetailPage } from '@/features/products';

export const Route = createFileRoute('/_authed/_shell/products/$productId')({
  component: ProductDetailRoute,
});

function ProductDetailRoute() {
  const { productId } = Route.useParams();
  return <ProductDetailPage productId={productId} />;
}
