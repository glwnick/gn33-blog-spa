import env from '@/config/env';

/**
 * An uploaded post image is stored as a site-relative `/v1/post-images/...` path; the API may live on another
 * origin than the SPA, so it has to be resolved against `API_URL` before it can be an `<img src>`. Hotlinked
 * https URLs pass through untouched.
 */
export const resolveImageUrl = (value: string): string =>
  value.startsWith('/') ? `${env.API_URL}${value}` : value;
