import { createLink } from '@tanstack/react-router';

/**
 * A real anchor styled as a button via `buttonVariants(...)`, not `ButtonLink` - `Button` renders a
 * `<button>`, so `ButtonLink` would emit an invalid `<button href="...">`: announced as a button and unable
 * to open in a new tab (`top-nav.tsx`'s own `PlainNavLink` documents the same trap for its unstyled sibling).
 */
export const ButtonNavLink = createLink(
  ({ className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props} className={className} />
  ),
);
