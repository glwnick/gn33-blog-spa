import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getCookie, getRequestHeader } from '@tanstack/react-start/server';
import {
  defaultLanguage,
  defaultNS,
  languageCookieName,
  resources,
  supportedLanguages,
} from './i18n-config';
import type { i18n as I18nInstance } from 'i18next';

/**
 * Server-only per-request language resolution, mirroring `lib/server-auth.ts`'s pattern: this reaches
 * into `@tanstack/react-start/server`, which does not exist in a browser, so it must only ever be
 * reached through `createIsomorphicFn().server(...)` (see `lib/i18n.ts`'s `getStoredLanguage` and
 * `router.tsx`'s `Wrap`), never a plain `import.meta.env.SSR` branch.
 *
 * This exists because `i18next-browser-languagedetector`'s `navigator` detector cannot be trusted on
 * the server (see `lib/i18n.ts`'s `detection.order` comment - Node's own global `navigator.language`
 * is the *container's* locale, not the visitor's), so SSR had no per-visitor language signal at all
 * beyond the constant `defaultLanguage` - every non-`defaultLanguage`-browser visitor hydrated into a
 * full-page text mismatch, since the client's own detector resolves the *real* `navigator.language`
 * synchronously, before `hydrateRoot()` even runs. That mismatch is not just cosmetic: React's recovery
 * from it discards the mismatched subtree and "synchronously renders the entire root" from the client's
 * state (confirmed live via `gn33-shop-spa-e2e` - the console literally says so), which also stomps
 * anything the app set imperatively before that recovery ran (`client.tsx`'s `<html lang>` sync among
 * it) - so this is worth fixing at the source rather than working around downstream.
 *
 * `Accept-Language` is the one per-visitor signal the server has for a *first* visit (generated from the
 * same browser/OS locale settings `navigator.language` is), so resolving it the same way the client's
 * own detector would (best supported match, else `defaultLanguage`) makes the two agree for that case.
 *
 * A *returning* visitor with an explicit stored preference is resolved from the `languageCookieName`
 * cookie instead, checked first: `lib/i18n.ts`'s `detection.caches` writes that cookie as a mirror of
 * `localStorage` (the client's own resolver still reads `localStorage` directly, never the cookie - the
 * cookie exists purely so this server-side read has something to see). Without it, a visitor whose
 * stored preference differs from their browser's current `Accept-Language` default hydrated into a full
 * text-content mismatch on every SSR page load - not cosmetic: React discards the mismatched subtree and
 * resynchronizes the whole root from client state, reproduced live via `gn33-shop-spa-prod-e2e` as
 * "Minified React error #418" (see https://react.dev/errors/418).
 */

function resolveFromAcceptLanguage(header: string | undefined): string {
  if (!header) return defaultLanguage;

  const supported = new Set<string>(supportedLanguages);

  // "en-US,en;q=0.9,ro;q=0.8" -> [{code:'en',q:0.9}, {code:'en',q:0.9}, {code:'ro',q:0.8}], highest q first.
  // Matches on the primary subtag (`en-US` -> `en`) the same way the app's supported-language codes are
  // shaped; a malformed entry (unparseable q, empty tag) is skipped rather than crashing the render.
  const candidates = header
    .split(',')
    .map((entry) => {
      const [tag, ...params] = entry.trim().split(';');
      const code = tag.trim().split('-')[0]?.toLowerCase();
      const qParam = params
        .map((p) => p.trim())
        .find((p) => p.startsWith('q='));
      const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
      return { code, q: Number.isFinite(q) ? q : 1 };
    })
    .filter(
      (candidate): candidate is { code: string; q: number } =>
        !!candidate.code,
    )
    .sort((a, b) => b.q - a.q);

  const match = candidates.find((candidate) => supported.has(candidate.code));
  return match?.code ?? defaultLanguage;
}

/**
 * Synchronous and safe to call anywhere in the server request's call chain: `getCookie` and
 * `getRequestHeader` both read from the `AsyncLocalStorage` `@tanstack/start-server-core` establishes
 * around the whole request, not from anything scoped to a particular hook.
 *
 * The cookie takes priority over `Accept-Language`, mirroring the client's own priority (`localStorage`
 * before `navigator` in `lib/i18n.ts`'s `detection.order`) - a stored preference, once one exists, always
 * wins over the browser's ambient default on both sides.
 */
export function getServerLanguage(): string {
  const cookieLanguage = getCookie(languageCookieName);
  if (cookieLanguage && supportedLanguages.includes(cookieLanguage)) {
    return cookieLanguage;
  }

  return resolveFromAcceptLanguage(getRequestHeader('accept-language'));
}

/**
 * A throwaway i18next instance for exactly one SSR render, carrying the language `getServerLanguage()`
 * resolved for this request. Deliberately a fresh `createInstance()`, never the shared singleton
 * `lib/i18n.ts` exports: that singleton is one object shared by every request this Node process ever
 * serves (see `router.tsx`'s own `getRouter()` header comment on exactly this class of leak, already
 * solved there for the router and query client) - mutating its `.language` per request would race
 * under concurrent visitors, since `ReactDOMServer.renderToString` runs synchronously but the loaders
 * awaited before it do not, leaving a real window between "resolve this request's language" and "render
 * with it" for another request to land in.
 *
 * `initReactI18next` on a *fresh* instance still writes to `react-i18next`'s one shared
 * `i18nInstance` module variable (`react-i18next/src/i18nInstance.js`) as its process-wide fallback for
 * any `useTranslation()` outside an explicit `I18nextProvider` - so this instance is only ever safe to
 * use *through* `router.tsx`'s `Wrap`, which provides it via `<I18nextProvider>` to every route
 * component the router renders. That fallback write still happens (nothing suppresses it) and is still
 * racy across requests, but it no longer matters as long as every real consumer reads from context
 * instead: confirmed by grepping every `useTranslation()` call site in this app (all under the routed
 * tree `Wrap` wraps, none in `Wrap` itself or in `routes/__root.tsx`'s `shellComponent`) and by
 * live-testing concurrent requests with different `Accept-Language` headers against
 * `gn33-shop-spa-e2e` for cross-contamination before this shipped.
 *
 * No `LanguageDetector` plugin is attached: `lng` is supplied directly from the already-resolved
 * `getServerLanguage()`, so there is nothing for a detector to do, and therefore no
 * `cacheUserLanguage` side effect (which would need `window.localStorage` this instance never touches
 * anyway) to guard against either.
 */
export function createServerI18nInstance(): I18nInstance {
  const instance = createInstance();
  void instance.use(initReactI18next).init({
    resources,
    defaultNS,
    lng: getServerLanguage(),
    fallbackLng: defaultLanguage,
    interpolation: {
      escapeValue: false,
    },
  });
  return instance;
}
