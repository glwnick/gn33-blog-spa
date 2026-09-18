import { createFileRoute } from '@tanstack/react-router';
import { activeOrderIdOptions, orderOptions } from '@/query-options/order-options';
import { featuredProductsOptions } from '@/query-options/product-options';
import { HomePage } from '@/pages/home/home-page';

export const Route = createFileRoute('/_auth/home/')({
  loader: async ({ context }) => {
    // The featured-products read doesn't depend on the active-order id, so it runs alongside that check
    // instead of after it - only the order-detail read, which needs the id, has to wait.
    const [activeOrderId] = await Promise.all([
      context.queryClient.ensureQueryData(activeOrderIdOptions()),
      context.queryClient.ensureQueryData(featuredProductsOptions()),
    ]);
    if (activeOrderId) {
      await context.queryClient.ensureQueryData(orderOptions(activeOrderId));
    }
  },
  component: HomePage,
});
