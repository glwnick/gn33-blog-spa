import { LayoutDashboard, Settings, UsersIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { LinkProps } from '@tanstack/react-router';
import type { TranslationKey } from '@/hooks/use-translation';

export type NavItem = {
  readonly to: LinkProps['to'];
  readonly titleKey: TranslationKey;
  readonly icon: LucideIcon;
};

/**
 * Items every visitor sees, signed in or not.
 *
 * <p>Empty: the feed is reachable without an account by design, and the wordmark link at the far left of
 * {@link TopNav} already leads there, so it needs no separate nav entry. About/Contact/T&Cs live in
 * {@link SiteFooter} instead - a blog's top bar should lead with content rather than with terms.
 */
export const PUBLIC_NAV_ITEMS: ReadonlyArray<NavItem> = [];

/** Links every visitor sees in {@link SiteFooter}, signed in or not. No icon: the footer renders plain text links. */
export const FOOTER_NAV_ITEMS: ReadonlyArray<Omit<NavItem, 'icon'>> = [
  { to: '/about', titleKey: 'about' },
  { to: '/contact', titleKey: 'contact' },
  { to: '/terms', titleKey: 'termsTitle' },
];

/** Items that need a signed-in user: their own posts dashboard. */
export const USER_NAV_ITEMS: ReadonlyArray<NavItem> = [
  { to: '/dashboard', titleKey: 'dashboard', icon: LayoutDashboard },
];

/**
 * Extra items for MANAGER and ADMIN roles.
 *
 * <p>There is no separate staff group any more: INSTRUCTOR was the only role that made staff broader than
 * manager, so the class-management and reports group it gated went with the fitness domain, and the
 * catalogue/order administration it later gated in the shop fork went with the e-commerce domain. Only
 * user management survives - there is no authorship tier above "any signed-in user" in the blog domain.
 */
export const MANAGER_NAV_ITEMS: ReadonlyArray<NavItem> = [
  { to: '/users', titleKey: 'users', icon: UsersIcon },
];

/** Extra items for ADMIN role only. */
export const ADMIN_NAV_ITEMS: ReadonlyArray<NavItem> = [
  {
    to: '/settings',
    titleKey: 'settings',
    icon: Settings,
  },
];
