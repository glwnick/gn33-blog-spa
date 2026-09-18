import { UserRound } from 'lucide-react';
import { createLink } from '@tanstack/react-router';
import { buttonVariants } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';

const PlainAnchor = (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a {...props} />
);

/**
 * A real anchor styled as a button rather than `ButtonLink` - see `top-nav.tsx`'s own `PlainNavLink` for why:
 * `ButtonLink` wraps base-ui's `<button>`-rendering `Button`, so it emits invalid `<button href="...">` markup.
 */
const AccountLink = createLink(PlainAnchor);

/**
 * The anonymous-visitor counterpart to `TopBarUser`: a single icon button straight to `/login`, rather than a
 * Login/Register pair - Register is one click away from the login page itself ("Don't have an account?
 * Register"), so a second top-level entry point just duplicated it and widened the bar for no benefit on mobile.
 */
export function TopBarGuest() {
  const { t } = useTranslation();

  return (
    <AccountLink
      to="/login"
      preload="intent"
      aria-label={t('account')}
      className={buttonVariants({ variant: 'ghost', size: 'icon' })}
    >
      <UserRound />
    </AccountLink>
  );
}
