import env from '@/config/env';

/**
 * Resolves a product image's stored `url` to a browser-fetchable one. The backend returns an API-relative path
 * (`/v1/products/{productId}/images/{fileName}`, plans/PLAN-catalogue-admin.md stage 2) rather than an absolute
 * URL, so it has to be prefixed with the API's own origin before use in an `<img src>` - the SPA and the API
 * are served from different origins in every environment that matters (this app's own dev/e2e setup included).
 *
 * <p>Anything that is not one of those API-relative paths is returned untouched - `CatalogueSeedConfig`'s
 * `/product-placeholder.svg` is an SPA static asset, not an API path, and any cart entry persisted before this
 * helper existed keeps resolving the same way it always did.
 *
 * <p>Per constraint 6, `env.API_URL` must resolve to a **browser-reachable** origin for this to stay correct -
 * it is today because `APP_API_URL` is the public origin, and it is the first thing that breaks if a future
 * deployment takes `config/env.ts`'s reserved internal-address seam for server-side calls instead.
 */
export const productImageSrc = (url: string): string =>
  url.startsWith('/v1/') ? `${env.API_URL}${url}` : url;
