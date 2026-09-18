import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'dark' | 'light';

type ThemeProviderProps = {
  children: React.ReactNode;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const DEFAULT_THEME: Theme = 'light';
const DEFAULT_STORAGE_KEY = 'vite-ui-theme';

const initialState: ThemeProviderState = {
  theme: DEFAULT_THEME,
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

/**
 * Applies the theme class before first paint, injected as a blocking inline script by
 * `routes/__root.tsx`.
 *
 * The class is otherwise only applied from the effect below, which runs after hydration - so a
 * server-rendered document would paint with the `:root` defaults and then snap to the real theme.
 * Kept next to `readStoredTheme` because the two must agree on the key and the default; a drift
 * between them shows up as a flash, which no test catches.
 *
 * Deliberately does not read `prefers-color-scheme`: light is the product default for every
 * visitor, overridden only by an explicit choice recorded in `localStorage`, not by the OS theme.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  DEFAULT_STORAGE_KEY,
)});if(t!=="dark"&&t!=="light"){t=${JSON.stringify(
  DEFAULT_THEME,
)}}document.documentElement.classList.add(t)}catch(e){document.documentElement.classList.add(${JSON.stringify(
  DEFAULT_THEME,
)})}})()`;

// This provider renders on every request (it wraps the whole app in `router.tsx`'s `Wrap`,
// including subtrees that stay `ssr: false`, since the root layout itself always renders server
// side). `localStorage` is not real there, so the initial read falls back to `initialState.theme`
// and the client corrects it on hydration.
//
// Two different SSR hosts, two different failure shapes, both requiring the two-step check below:
// under plain Node (the production Docker image), `localStorage` is not declared at all, and
// `typeof localStorage.getItem` - a member access on an undeclared identifier - throws
// `ReferenceError` before `typeof` ever gets a chance to make it safe (`typeof` only guards a bare
// identifier, not a property read on one). Under Vite's own dev SSR environment, by contrast,
// something in the pipeline predefines a `localStorage` global backed by Node's experimental Web
// Storage API, which exists but breaks with `.getItem is not a function` without
// `--localstorage-file`. `typeof localStorage === 'undefined'` alone only catches the first case.
const readStoredTheme = (storageKey: string): Theme => {
  if (
    typeof localStorage === 'undefined' ||
    typeof localStorage.getItem !== 'function'
  ) {
    return initialState.theme;
  }
  return (localStorage.getItem(storageKey) as Theme | null) || initialState.theme;
};

export function ThemeProvider({
  children,
  storageKey = DEFAULT_STORAGE_KEY,
  ...props
}: Readonly<ThemeProviderProps>) {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme(storageKey));

  useEffect(() => {
    const root = globalThis.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem(storageKey, theme);

    const handleKeyDownTheme = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      if (e.key.toLowerCase() === 't') {
        setTheme(theme === 'dark' ? 'light' : 'dark');
      }
    };

    window.addEventListener('keydown', handleKeyDownTheme);

    return () => {
      window.removeEventListener('keydown', handleKeyDownTheme);
    };
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme],
  );

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  return context;
};
