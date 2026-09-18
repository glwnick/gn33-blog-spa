import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { createIsomorphicFn } from '@tanstack/react-start';
import {
  defaultLanguage,
  defaultNS,
  languageCookieName,
  resources,
  supportedLanguages,
} from './i18n-config';
import { getServerLanguage } from './server-i18n';

export { defaultNS, resources, supportedLanguages, defaultLanguage };

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    fallbackLng: defaultLanguage,
    debug: import.meta.env.DEV,
    supportedLngs: supportedLanguages,

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      // `navigator` must be excluded server-side: Node (since v21) exposes a global `navigator`
      // of its own, and `navigator.language` on it reflects the *server machine's* locale, not
      // the visitor's browser - i18next-browser-languagedetector can't tell the two apart, so on
      // Node it would silently detect the container's own locale as if it were the visitor's on
      // every request. `localStorage`/`htmlTag` are harmless no-ops there (no `document`/real
      // `localStorage` exists), so dropping just `navigator` server-side is enough to let
      // `fallbackLng` above actually be the SSR default it's meant to be. Plain `import.meta.env.SSR`
      // is fine here (not `createIsomorphicFn`): this is a runtime value, not a server-only import.
      //
      // This *singleton* is no longer what renders SSR content, though: `router.tsx`'s `Wrap` provides
      // a fresh per-request instance (`lib/server-i18n.ts`'s `createServerI18nInstance`) to every route
      // component instead, which is what actually resolves a visitor's real `Accept-Language`. This
      // config still matters as the process-wide fallback `react-i18next` uses for any `useTranslation()`
      // that ever ends up outside that provider (see `server-i18n.ts`'s header) - keeping its own SSR
      // resolution sane rather than reverting to Node's bogus `navigator` is cheap insurance for that
      // case, even though nothing should reach it in the steady state.
      order: import.meta.env.SSR
        ? ['localStorage', 'htmlTag']
        : ['localStorage', 'navigator', 'htmlTag'],
      // `cookie` is a *write* target only (lookup still goes through `localStorage` above) - it exists
      // so `getServerLanguage()` in server-i18n.ts has a per-visitor signal that actually reflects a
      // stored preference, not just the browser's default `Accept-Language`. The library guards its own
      // `document` access (`typeof document !== 'undefined'`), so listing it here is a no-op on the
      // server rather than a crash.
      caches: ['localStorage', 'cookie'],
      lookupCookie: languageCookieName,
      cookieMinutes: 60 * 24 * 365, // ~1 year: matches how long the localStorage value effectively persists
    },
  });

export default i18n;

/**
 * The one value every API request sends as `Accept-Language` (`lib/axios.ts`'s interceptor) and every
 * language-dependent TanStack Query key includes (e.g. `query-options/collection-options.ts`,
 * `query-options/role-options.ts`), so it must resolve the *same* way on the server and the client for
 * a given visitor - otherwise SSR dehydrates data under one cache key and the client immediately
 * refetches under another. The client branch is unchanged (`localStorage`, feature-detected the way
 * the comment below explains); the server branch used to just return the constant `defaultLanguage`
 * (Node has no real `localStorage`, so the guard always failed), which is what caused that exact
 * mismatch for any visitor whose browser language wasn't `defaultLanguage` - now it resolves the same
 * per-request `Accept-Language` signal `getServerLanguage()` exists for.
 */
export const getStoredLanguage = createIsomorphicFn()
  .client(() => {
    // Feature-detect `getItem` itself, not `localStorage` and not `window`. Node exposes a
    // `localStorage` *object* with no methods on it unless `--localstorage-file` got a valid path, so
    // `typeof localStorage !== 'undefined'` alone would pass and the `getItem` call would still throw.
    // Moot for this branch specifically (it never runs on the server), but kept as a guard rather than
    // a bare `localStorage.getItem` call so it can't regress if this ever gets copied into a shared spot.
    const store = (globalThis as { localStorage?: Storage }).localStorage;
    return (
      (typeof store?.getItem === 'function' && store.getItem('i18nextLng')) ||
      defaultLanguage
    );
  })
  .server(() => getServerLanguage());
