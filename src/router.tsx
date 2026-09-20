import '@/lib/zod-config.ts';
import { createRouter } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { createIsomorphicFn } from '@tanstack/react-start';
import { I18nextProvider } from 'react-i18next';

import type { DehydratedAuth } from '@/lib/dehydrated-auth.ts';
import { DefaultNotFound } from '@/components/default-not-found.tsx';
import { ThemeProvider } from '@/context/theme-provider.tsx';
import { AuthProvider } from '@/context/auth-provider.tsx';
import { routeTree } from '@/routeTree.gen.ts';
import { createQueryClient } from '@/lib/query-client.ts';
import { getAuthSnapshot } from '@/lib/auth-token.ts';
import { hydrateAuth } from '@/lib/dehydrated-auth.ts';
import {
  getServerSessionSnapshot,
  serverHasRefreshCookie,
} from '@/lib/server-auth.ts';
import { resolveServerNonce } from '@/lib/server-csp.ts';
import sharedI18n from '@/lib/i18n.ts';
import { createServerI18nInstance } from '@/lib/server-i18n.ts';
import { Toaster } from '@/components/ui/sonner.tsx';

// `createIsomorphicFn` rather than a plain `import.meta.env.SSR` ternary: `lib/server-auth.ts` reaches into
// `@tanstack/react-start/server`, which does not exist in a browser, and only this macro's compiler
// transform - not a runtime branch a bundler has to prove dead - keeps that import out of the client build.
const readServerAuth = createIsomorphicFn()
  .client((): DehydratedAuth => ({ user: null, hasRefreshCookie: true }))
  .server(
    (): DehydratedAuth => ({
      user: getServerSessionSnapshot().user,
      hasRefreshCookie: serverHasRefreshCookie(),
    }),
  );

// The client always reuses the one shared singleton (there is only ever one visitor per browser tab,
// so nothing to isolate); the server gets a fresh instance per call - see `lib/server-i18n.ts`'s header
// for why a fresh instance rather than mutating the shared one, and why it's safe only because `Wrap`
// below provides it explicitly to every route component instead of relying on `react-i18next`'s
// process-wide fallback.
const resolveI18nInstance = createIsomorphicFn()
  .client(() => sharedI18n)
  .server(() => createServerI18nInstance());

// The client's own bootstrap (`hydrate()` in `@tanstack/router-core`'s ssr-client) overwrites
// `router.options.ssr` from the `<meta property="csp-nonce">` tag `RootDocument` renders, before
// hydration - so the client branch here never has to produce a real value, only satisfy the type.
// `undefined` for `ssr.nonce` server-side would mean no inline script the framework injects carries
// one, which is exactly the gap `SECURITY-AUDIT-2026-09-15.md`'s CSP follow-up (`server.mjs`'s own
// header comment) left for this pass.
const resolveNonce = createIsomorphicFn()
  .client((): string | undefined => undefined)
  .server(() => resolveServerNonce());

/**
 * The framework calls this on every request (server) and once on the client, so it must stay a
 * factory rather than a module-level singleton - a shared instance would leak router state (and,
 * on the server, request state) across requests. The query client is created per call for exactly
 * the same reason, and that per-request lifetime is now load-bearing rather than merely careful:
 * `setupRouterSsrQueryIntegration` below dehydrates this exact client's cache into the response
 * HTML, so a shared client would serialize one visitor's query data into another's page.
 */
export function getRouter() {
  const queryClient = createQueryClient();
  // Resolved once per call (see this function's own header comment on why that matters), not inside
  // `Wrap`'s render body below: `Wrap` can re-render, and re-resolving there would create a fresh
  // server instance - wasted work at best - on every one of those re-renders instead of once per request.
  const i18nInstance = resolveI18nInstance();

  const router = createRouter({
    routeTree,
    // Both entries are real values, not `undefined!` placeholders: a loader that trusts
    // `context.queryClient` has to actually get one. `auth` is refreshed on every navigation by
    // the root route's `beforeLoad`; this is only its starting value.
    context: {
      queryClient,
      auth: getAuthSnapshot(),
    },
    ssr: { nonce: resolveNonce() },
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultStructuralSharing: true,
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: () => <DefaultNotFound />,
    // Slice 6b-2 (`plans/PLAN-slice-6b-auth-ssr.md`): seeds `lib/auth-token.ts`'s store from the server's
    // resolved session before the client's first render, so an authenticated `_auth` page hydrates against
    // the same `user` `AuthProvider` rendered on the server instead of the anonymous default. It carries the
    // `user` and whether a refresh cookie existed, never the access token - see `lib/dehydrated-auth.ts`
    // for what the client does with each and `lib/server-auth.ts`'s header for why the token stays out.
    dehydrate: (): DehydratedAuth => readServerAuth(),
    hydrate: hydrateAuth,
    // Replaces `main.tsx`'s old `InnerApp`/`AuthLoadingScreen` gate, which refused to mount
    // `RouterProvider` at all until the session refresh resolved. That gate is incompatible with
    // SSR (the server would always render the loading card) and with a router that must mount
    // immediately, so providers move here instead and each route guard is responsible for
    // tolerating `auth.isInitializing` on its own - see `_auth.tsx`, and
    // `__root.tsx`'s `useGuardsFollowTheSession` for what re-runs them once it clears.
    Wrap: ({ children }) => (
      <I18nextProvider i18n={i18nInstance}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeProvider>
              {children}
              <Toaster />
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </I18nextProvider>
    ),
  });

  // Dehydrates this request's `queryClient` into the response and rehydrates it on the client
  // before the first render, so a route's `ensureQueryData` loader and its `useSuspenseQuery`
  // component share one fetch instead of the client refetching everything the server already
  // resolved. The first-party integration rather than a hand-rolled `dehydrate`/`hydrate` pair:
  // it also covers deferred and streamed queries, which the house pattern of "resolve everything
  // in the loader" does not need today but will.
  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
