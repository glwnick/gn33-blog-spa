import {
  ClipboardList,
  Heart,
  HomeIcon,
  LayoutGrid,
  Library,
  Package,
  Settings,
  ShoppingBag,
  Upload,
  UsersIcon,
} from 'lucide-react';
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
 * <p>The catalogue is reachable without an account by design, so it must not be gated behind
 * {@link USER_NAV_ITEMS}. About/Contact/T&Cs moved out to {@link SiteFooter} - a shop's top bar should lead with
 * product rather than with terms. Collections still belongs here once it lands. The cart is a dedicated
 * icon button in the top bar's right-hand cluster per the design handoff, not a plain nav item, so it is
 * never listed here.
 */
export const PUBLIC_NAV_ITEMS: ReadonlyArray<NavItem> = [
  { to: '/shop', titleKey: 'shop', icon: ShoppingBag },
];

/** Links every visitor sees in {@link SiteFooter}, signed in or not. No icon: the footer renders plain text links. */
export const FOOTER_NAV_ITEMS: ReadonlyArray<Omit<NavItem, 'icon'>> = [
  { to: '/about', titleKey: 'about' },
  { to: '/contact', titleKey: 'contact' },
  { to: '/terms', titleKey: 'termsTitle' },
];

/**
 * Items that need a signed-in user.
 *
 * <p>Only Home survived the fitness strip until slice 4 added "My orders" next to it. Favorites joined the
 * same group once the wishlist domain landed - the heart button on a product card needs somewhere to send a
 * shopper who wants to see everything they saved.
 */
export const USER_NAV_ITEMS: ReadonlyArray<NavItem> = [
  { to: '/home', titleKey: 'home', icon: HomeIcon },
  { to: '/orders', titleKey: 'myOrders', icon: Package },
  { to: '/favorites', titleKey: 'favorites', icon: Heart },
];

/**
 * Extra items for MANAGER and ADMIN roles.
 *
 * <p>There is no separate staff group any more: INSTRUCTOR was the only role that made staff broader than manager,
 * so the class-management and reports group it gated went with the fitness domain. Reporting returns rebuilt against
 * orders. Order management (slice 7) joined Users here per the design handoff's own nav proposal.
 *
 * <p>Catalogue administration (plans/PLAN-catalogue-admin.md, decision 4) joined the same group: `Package` is
 * already taken by "My orders" in {@link USER_NAV_ITEMS}, so `LayoutGrid` is used instead.
 *
 * <p>Yarns, sizes and materials share one entry, `/admin/library`: three small, slow-changing lookups a variant
 * is made from, not three separate destinations a maker navigates between often enough to want their own icons.
 * Categories joined the same page as a fourth, ADMIN-only section (moved off `/settings`) rather than getting
 * its own nav entry, for the same reason; `LibraryPage` itself hides that section from a plain MANAGER.
 */
export const MANAGER_NAV_ITEMS: ReadonlyArray<NavItem> = [
  { to: '/users', titleKey: 'users', icon: UsersIcon },
  { to: '/admin/orders', titleKey: 'orderManagement', icon: ClipboardList },
  { to: '/admin/products', titleKey: 'catalogue', icon: LayoutGrid },
  { to: '/admin/library', titleKey: 'adminLibrary', icon: Library },
];

/** Extra items for ADMIN role only. */
export const ADMIN_NAV_ITEMS: ReadonlyArray<NavItem> = [
  {
    to: '/import',
    titleKey: 'csvImport',
    icon: Upload,
  },
  {
    to: '/settings',
    titleKey: 'settings',
    icon: Settings,
  },
];
