/**
 * L7, SECURITY-AUDIT-2026-09-15.md: `?redirect=` is caller-supplied query-string input
 * (`_no-auth.tsx`'s `validateSearch`), and two call sites passed it straight to the router's
 * `redirect({ to })` / `navigate({ to })` with no shape check at all. TanStack Router navigates
 * client-side rather than assigning a raw URL, so this was not an open redirect today - but nothing
 * enforced that the value stays an internal path, which is a dependency worth not accumulating
 * silently as the app's own navigation code changes around it.
 *
 * A safe target is a root-relative path: it starts with a single `/` and is not protocol-relative
 * (`//host/...`, which a browser resolves as an absolute URL to `host`, not a path on the current
 * origin).
 */
export const isSafeRedirectTarget = (
  target: string | undefined | null,
): target is string => !!target && target.startsWith('/') && !target.startsWith('//');
