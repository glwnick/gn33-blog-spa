import { createFileRoute } from '@tanstack/react-router';
import { CartPage } from '@/pages/shop/cart-page';

/**
 * The cart lives in `localStorage`, is entirely per-visitor and has no crawler value, unlike
 * `/shop` and `/shop/$slug` which prefetch real product data in a loader precisely because a
 * crawler needs it. `ssr: false` here for the same reason `_auth` is: rendering a shell server-side
 * with nothing real to hydrate against would just add hydration-mismatch risk for no SEO gain.
 */
export const Route = createFileRoute('/cart')({
  ssr: false,
  component: CartPage,
});
