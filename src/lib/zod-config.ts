import { z } from 'zod';

/**
 * Zod v4 JIT-compiles object schemas with `new Function(...)` for speed, and probes for eval
 * support once (memoized forever after) the first time any schema needs it. Under this app's CSP
 * (`server.mjs`, no `'unsafe-eval'` - see its own comment for why that's staying that way) the
 * probe still "succeeds" while the policy is report-only, but logs a violation every time - and
 * would actually fail once the policy is promoted to enforcing, silently falling back to the
 * slower interpreted path at that point anyway. `jitless: true` skips the probe entirely: same
 * fallback behavior, deterministically, with no console noise either way.
 *
 * On the client this can't be a plain module-level `z.config(...)` call: which of several bundled
 * chunks actually constructs the first `z.object(...)` is a Rollup chunking decision, not something
 * import order in our own source reliably wins against. `ZOD_JITLESS_INIT_SCRIPT` is the fix Zod's
 * own docs describe for exactly this - pre-populating the shared `globalThis.__zod_globalConfig`
 * before Zod's module even loads - rendered as a blocking inline `<script>` in `routes/__root.tsx`,
 * the same pattern already used there for `context/theme-provider.tsx`'s `THEME_INIT_SCRIPT`: a
 * browser-parsed synchronous script always runs before any `<script type="module">`, so there is no
 * chunk-ordering question left to get wrong.
 */
export const ZOD_JITLESS_INIT_SCRIPT =
  'window.__zod_globalConfig={jitless:true};';

/**
 * The server has no "before any module loads" hook to mirror the inline script above, but it also
 * has no chunk-splitting to race against: this module is a plain, early import (see `router.tsx`),
 * so a direct call is reliable here. Harmless if it runs after the client's own init too, since
 * `z.config` merges into the same shared object either way.
 */
z.config({ jitless: true });
