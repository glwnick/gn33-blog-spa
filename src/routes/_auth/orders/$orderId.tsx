import { createFileRoute } from '@tanstack/react-router';
import { OrderDetailPage } from '@/pages/orders/order-detail-page';
import { orderOptions } from '@/query-options/order-options';

export const Route = createFileRoute('/_auth/orders/$orderId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(orderOptions(params.orderId)),
  component: () => {
    const { orderId } = Route.useParams();
    return <OrderDetailPage orderId={orderId} />;
  },
});
