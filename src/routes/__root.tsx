import { useEffect } from 'react';
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from '@tanstack/react-router';
import { createIsomorphicFn } from '@tanstack/react-start';
import type { QueryClient } from '@tanstack/react-query';
import type { AuthSnapshot } from '@/lib/auth-token';
import { getAuthSnapshot, subscribeToAuthSnapshot } from '@/lib/auth-token';
import { resolveServerSession } from '@/lib/server-auth';
import { THEME_INIT_SCRIPT } from '@/context/theme-provider';
import { ZOD_JITLESS_INIT_SCRIPT } from '@/lib/zod-config';
import { SiteFooter } from '@/components/layout/site-footer';
import { TopNav } from '@/components/layout/top-nav';
import '@/styles.css';
import { defaultLanguage } from '@/lib/i18n';
import { getServerLanguage } from '@/lib/server-i18n';

// `auth` is the plain session snapshot, not the full `AuthContextType`: `beforeLoad` runs outside
// the React tree, so the context's callbacks (`login`, `logout`, ...) are neither available there
// nor meaningful to a route guard.
type RouterContextType = {
  queryClient: QueryClient;
  auth: AuthSnapshot;
};

// `createIsomorphicFn` rather than a plain `import.meta.env.SSR` ternary: `lib/server-auth.ts` reaches into
// `@tanstack/react-start/server`, which does not exist in a browser, and only this macro's compiler
// transform - not a runtime branch a bundler has to prove dead - keeps that import out of the client build.
// `lib/auth-token.ts`'s store is never written on the server (see its header), so `getAuthSnapshot()` there
// would always be the anonymous `INITIAL_AUTH_SNAPSHOT`, correct for a real anonymous visitor but wrong for
// an authenticated one whose `_auth` pages this now server-renders - `resolveServerSession()` is what
// resolves the real one.
const resolveAuthContext = createIsomorphicFn()
  .client(() => getAuthSnapshot())
  .server(() => resolveServerSession());

// The client always starts the document at `defaultLanguage`: the static shell has no per-visitor
// signal to resolve at build time, and the actual client-rendered *content* still comes from
// `lib/i18n.ts`'s own detection, unaffected by this attribute either way - `client.tsx`'s
// `languageChanged` listener corrects it to match shortly after mount if the client resolves something
// else. Server-side this uses the same `Accept-Language`-derived value that now also drives the actual
// server-rendered *content* (`router.tsx`'s `Wrap`, via `lib/server-i18n.ts`'s
// `createServerI18nInstance`), so the two agree by construction rather than by coincidence.
// `suppressHydrationWarning` below covers this attribute specifically differing between the two on
// first paint - the one client/server difference here that's still deliberate.
const resolveHtmlLanguage = createIsomorphicFn()
  .client(() => defaultLanguage)
  .server(() => getServerLanguage());

export const Route = createRootRouteWithContext<RouterContextType>()({
  // Supplies `context.auth` for every route below. Runs on each navigation (server request or
  // client transition alike), so `_auth`/`_no-auth` always see the current snapshot - see
  // `lib/auth-token.ts` for why this reads a plain store rather than `useAuth()`.
  beforeLoad: async () => ({ auth: await resolveAuthContext() }),
  // Ported from the old `index.html` `<head>` verbatim - that file no longer serves as the
  // document template now that `shellComponent` owns the full `<html>` document. Static
  // site-wide for now; Stage E of the public-catalogue plan gives storefront routes their own
  // `head()` (per-product title/description/OG/canonical/hreflang), which layers on top of this.
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content:
          'width=device-width, initial-scale=1.0, interactive-widget=resizes-content',
      },
      { httpEquiv: 'X-UA-Compatible', content: 'IE=edge' },
      { title: 'GN33 Blog' },
      { name: 'title', content: 'GN33 Blog' },
      {
        name: 'description',
        content:
          'A community blog: read stories, publish your own posts and join the conversation.',
      },
      {
        name: 'keywords',
        content: 'gn33, blog, stories, writing, community',
      },
      { name: 'author', content: 'GN33 Blog' },
      // Matches --primary in src/styles.css
      { name: 'theme-color', content: '#b95019' },
      // Open Graph / Facebook. Absolute URLs: a link preview is fetched by a crawler with no
      // page context, so a relative image path resolves against the wrong origin or not at all.
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://app.gn33.eu/' },
      { property: 'og:title', content: 'GN33 Blog' },
      {
        property: 'og:description',
        content:
          'A community blog: read stories, publish your own posts and join the conversation.',
      },
      {
        property: 'og:image',
        content: 'https://app.gn33.eu/nLogoColorBG.png',
      },
      // Twitter
      { property: 'twitter:card', content: 'summary_large_image' },
      { property: 'twitter:url', content: 'https://app.gn33.eu/' },
      { property: 'twitter:title', content: 'GN33 Blog' },
      {
        property: 'twitter:description',
        content:
          'A community blog: read stories, publish your own posts and join the conversation.',
      },
      {
        property: 'twitter:image',
        content: 'https://app.gn33.eu/nLogoColorBG.png',
      },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/nLogoColorBG.svg' },
      { rel: 'apple-touch-icon', href: '/nLogoColorBG.png' },
      // Minimal manifest: only unlocks Web Push on installed iOS Safari, not a full offline PWA
      { rel: 'manifest', href: '/manifest.webmanifest' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: '',
      },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  // Set server-side by `router.tsx`'s `ssr: { nonce: resolveNonce() }`; overwritten client-side,
  // before this ever renders there, from the `<meta property="csp-nonce">` tag `HeadContent` below
  // renders for us whenever `ssr.nonce` is set (the framework's own hydration bootstrap reads it -
  // see `@tanstack/router-core`'s ssr-client `hydrate()`). `server.mjs` puts the matching
  // `'nonce-...'` source on `script-src`.
  const nonce = useRouter().options.ssr?.nonce;
  return (
    // `suppressHydrationWarning`: the inline script below adds the theme class to this element before
    // React hydrates, and `lang` (see `resolveHtmlLanguage` above) is deliberately a different value
    // server vs. client too. Both are the point, not a mismatch worth reporting.
    <html lang={resolveHtmlLanguage()} suppressHydrationWarning>
      <head>
        {/* Must run before any bundled module script, including the one that first constructs a
            Zod object schema - see `lib/zod-config.ts`'s header for why that can't be guaranteed by
            our own import order alone. */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: ZOD_JITLESS_INIT_SCRIPT }} />
        {/* Must run before first paint and before hydration, so it is a blocking inline script
            rather than anything React renders. Without it the server emits no theme class at all
            and the page paints with the `:root` defaults until `ThemeProvider`'s effect corrects
            it - a visible flash of the wrong theme on every cold load. */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        {children}
        {/* Rewritten from the environment when the container starts; must load before the
            module entry (`src/client.tsx`), which reads it through `config/env.ts`. Preserved
            as a raw tag - a build-time-bundled config script would defeat the point of it. */}
        <script src="/config.js" />
        <Scripts />
      </body>
    </html>
  );
}

/**
 * Re-runs every route guard when the session changes.
 *
 * This hook only runs client-side (it is a `useEffect`), which is where it still matters:
 * `AuthProvider`'s own refresh effect establishes the session, so the client's very first
 * `beforeLoad` pass necessarily observes `isInitializing: true` and every guard defers (see
 * `_auth.tsx`) - `router.tsx`'s `hydrate` seeds `isInitializing: true` even for an authenticated
 * visitor, on purpose, so the refresh effect is still what supplies the real access token. (On the
 * server this no longer applies: `lib/server-auth.ts` resolves the session synchronously before any
 * `beforeLoad` returns, so the server's own pass is never deferred.) Nothing else re-runs the
 * client's guards, so without this the deferred verdict would be the only one ever reached: an
 * anonymous deep link to `/profile` would sit on a blank page instead of redirecting to `/login`,
 * and a customer with outstanding terms/GDPR consent would never be bounced to `/terms` on a reload.
 *
 * Subscribing to the store rather than to `useAuth()` is deliberate: the store notifies
 * synchronously on write, so `invalidate()` always re-reads a snapshot that is already current.
 * A `useEffect` on the rendered auth values would fire before `AuthProvider`'s own effects (React
 * runs child effects first), and could invalidate against the previous session.
 */
function useGuardsFollowTheSession() {
  const router = useRouter();
  useEffect(
    () => subscribeToAuthSnapshot(() => void router.invalidate()),
    [router],
  );
}

function RootLayout() {
  useGuardsFollowTheSession();

  return (
    // The navigation is mounted here rather than in `_auth` so that it is present on the public storefront and on
    // the sign-in pages too: it is the same bar either way, only its right-hand side differs.
    <div className="flex min-h-svh flex-col">
      <TopNav />
      <div className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </div>
      <SiteFooter />
    </div>
  );
}
