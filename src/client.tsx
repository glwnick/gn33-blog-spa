import { StrictMode, startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { StartClient } from '@tanstack/react-start/client';
import reportWebVitals from '@/reportWebVitals.ts';
import i18n from '@/lib/i18n.ts';

// Purely cosmetic (a console easter egg), carried over from the pre-Start `main.tsx`. It used to be a component
// mounted as a sibling of `<StartClient />`, which forked the hydration root into two children on the client
// while the server's tree (`<StartServer />`, no such sibling - see `defaultRenderHandler.tsx`) has only one.
// Every `useId` call anywhere in the app encodes its position in that tree, so the extra fork shifted every one
// of them and none matched what was server-rendered. Logging directly, outside the React tree, keeps the
// hydration root identical to the server's while still re-logging in the visitor's language: `i18n` is the same
// singleton `useTranslation` reads, already initialized by the time this module runs (`__root.tsx` imports
// `lib/i18n` for its side effect, and ESM imports resolve before any component renders).
function logConsoleWarning() {
  const titleStyle =
    'color: red; font-family: sans-serif; font-size: 40px; font-weight: bold; -webkit-text-stroke: 1px black;';
  const bodyStyle = 'font-size: 18px; line-height: 1.5;';

  console.log('%cStop!', titleStyle);
  console.log('%c' + i18n.t('consoleWarningMessage'), bodyStyle);
}

// `__root.tsx`'s `<html lang>` is a request-independent static value on the client (see its
// `resolveHtmlLanguage` comment - there's no per-visitor signal to resolve at build time), so it only
// ever matches the client's real resolved language by coincidence. Syncing it here, on every language
// change - including the one `i18n.init()` already made by the time this module runs, detected before
// `hydrateRoot` below - is what keeps the *declared* document language (what a screen reader announces)
// from permanently disagreeing with the *rendered* one. Imperative, not React-owned: `<html>` carries
// `suppressHydrationWarning` for exactly this kind of deliberate first-paint difference, and nothing
// else in the tree re-renders that attribute afterward, so this can't fight a later React commit.
function syncDocumentLanguage(lng: string) {
  document.documentElement.lang = lng;
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
  );
});

syncDocumentLanguage(i18n.language);
logConsoleWarning();
i18n.on('languageChanged', (lng) => {
  syncDocumentLanguage(lng);
  logConsoleWarning();
});

if (import.meta.env.DEV) {
  reportWebVitals(console.log);
}
