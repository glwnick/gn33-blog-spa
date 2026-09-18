import { createFileRoute } from '@tanstack/react-router';
import { OrdersPage } from '@/pages/orders/orders-page';
import { orderListSearchSchema } from '@/schemas/orders';
import { myOrdersOptions } from '@/query-options/order-options';

export const Route = createFileRoute('/_auth/orders/')({
  validateSearch: (search) => orderListSearchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureInfiniteQueryData(myOrdersOptions(deps.filter ?? 'ALL')),
  component: OrdersPage,
});
