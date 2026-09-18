import { createFileRoute } from '@tanstack/react-router';
import { OrderBoardPage } from '@/pages/admin/order-board-page';

// The literal `admin` path segment is only here to give this route a distinct URL from the customer-facing
// `/orders` route one level up in `_auth` - `_manager` (this route's actual auth gate) is pathless and
// contributes nothing to the URL, same as `_admin` contributes nothing to `/settings` or `/import`. See the
// slice 7 plan's conflict-resolution section for the full reasoning.
export const Route = createFileRoute('/_auth/_manager/admin/orders/')({
  component: OrderBoardPage,
});
