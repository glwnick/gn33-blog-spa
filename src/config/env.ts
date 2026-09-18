/**
 * Runtime configuration injected by the container at start-up, so one image is deployable to any
 * environment. `/config.js` is regenerated from environment variables by the nginx image's
 * docker-entrypoint.d script before nginx accepts a request; under `pnpm dev` it is the no-op
 * `public/config.js`, and the `import.meta.env` fallbacks below take over.
 *
 * The alternative - baking VITE_APP_API_URL in as a Docker build arg - pinned the image to one
 * hostname and made every URL change a rebuild.
 */
type RuntimeConfig = {
  apiUrl?: string;
  issuer?: string;
  env?: string;
  enableApiMocking?: boolean;
};

declare global {
  interface Window {
    __GN33_CONFIG__?: RuntimeConfig;
  }
}

type Env = {
  API_URL: string;
  ENABLE_API_MOCKING: boolean;
  IS_DEVELOPMENT: boolean;
  ISSUER: string;
};

const runtime: RuntimeConfig =
  (typeof window !== 'undefined' && window.__GN33_CONFIG__) || {};

// `window.__GN33_CONFIG__` is only ever written by the browser (`server.mjs` regenerates
// `dist/client/config.js` at start-up, but nothing loads that file server-side), so `runtime` above is always
// `{}` during SSR and the build-time `VITE_APP_API_URL` would otherwise be the only candidate - undefined in
// the production image, since `.env` is dockerignored and the Dockerfile declares no build arg for it. Read
// the real value from the server's own process environment instead: `server.mjs` already exits at start-up if
// `APP_API_URL` is unset, so it is guaranteed present here. `import.meta.env.VITE_APP_API_URL` still covers
// `pnpm dev`, where Vite does load `.env` into the SSR process.
//
// `import.meta.env.SSR` is a static build-time flag, so Vite tree-shakes this whole branch - and the
// `process.env` access with it - out of the client bundle.
//
// A future deployment that wants the server to call an internal address rather than the public origin is the
// seam to change: swap this for that internal variable rather than reusing `APP_API_URL`.
const serverApiUrl = import.meta.env.SSR ? process.env.APP_API_URL : undefined;

const appEnv = runtime.env ?? import.meta.env.VITE_APP_ENV;

const ENV: Env = {
  // Deliberately the full public origin in production rather than an empty same-origin string: the
  // service worker's API base has to be absolute (a static public/ asset cannot read import.meta.env,
  // so it is handed this value at runtime), and an empty value would quietly break it. Requests stay
  // same-origin either way under the single-origin topology, so nothing is lost.
  API_URL: runtime.apiUrl || serverApiUrl || import.meta.env.VITE_APP_API_URL,
  ENABLE_API_MOCKING:
    runtime.enableApiMocking ??
    import.meta.env.VITE_APP_ENABLE_API_MOCKING === 'true',
  IS_DEVELOPMENT: appEnv === 'dev',
  ISSUER: runtime.issuer || import.meta.env.VITE_APP_ISSUER,
};

export default ENV;
