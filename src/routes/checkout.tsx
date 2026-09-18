import { createFileRoute } from '@tanstack/react-router';
import { CheckoutPage } from '@/pages/shop/checkout-page';

/**
 * Same reasoning as `/cart`: a per-visitor mutation flow with zero crawler value, so `ssr: false`
 * rather than rendering a shell server-side with nothing real to hydrate against.
 */
export const Route = createFileRoute('/checkout')({
  ssr: false,
  component: CheckoutPage,
});
