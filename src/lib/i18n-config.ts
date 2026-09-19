import enTranslations from '../locales/en.json';
import roTranslations from '../locales/ro.json';

// Pure, dependency-free data: no import of `i18next`, `lib/i18n.ts`, or `lib/server-i18n.ts`. Both of
// those files need this data, and `lib/i18n.ts` (the shared client/server instance) also needs to call
// into `lib/server-i18n.ts` (SSR-only, per-request resolution) - if that module pulled its config back
// out of `lib/i18n.ts` instead of here, the two would import each other.

export const defaultNS = 'translation';

export const resources = {
  en: {
    translation: enTranslations,
  },
  ro: {
    translation: roTranslations,
  },
} as const;

export const supportedLanguages = ['en', 'ro'];

// The single source of truth for "no other signal decided the language" - the i18next fallback, the
// SSR per-request resolver's own fallback, and the language switcher's display fallback all read this
// rather than each hardcoding their own default.
export const defaultLanguage = 'ro';

// The single source of truth for the cookie name that mirrors the client's `i18nextLng` localStorage
// value. `lib/i18n.ts` writes it (`detection.caches`) whenever the language changes; `lib/server-i18n.ts`
// reads it so SSR can resolve a *returning* visitor's actual stored preference instead of only guessing
// from `Accept-Language` - see that file's header for the mismatch this closes. `i18next-browser-languagedetector`'s
// own default cookie name is also `'i18next'`; naming it explicitly here rather than relying on that
// default keeps the one name shared by both read and write sides from silently drifting if either side's
// config is ever touched separately.
export const languageCookieName = 'i18next';
