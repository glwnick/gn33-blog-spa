import { createLink } from '@tanstack/react-router';

const PlainAnchor = (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a {...props} />
);

/**
 * A real `<a>`, unlike the shared `ButtonLink` (`createLink(Button)`), which renders `<button href="...">`
 * since base-ui's `Button` is a `<button>` - invalid markup that cannot be middle-clicked or opened in a new
 * tab. Style it with `buttonVariants(...)` to get button pixels on the right element.
 */
export const AnchorLink = createLink(PlainAnchor);
