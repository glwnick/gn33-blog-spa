import { useState } from 'react';
import { createLink, useMatchRoute } from '@tanstack/react-router';
import { ChevronDown, Menu, PenLine } from 'lucide-react';
import type { LinkComponent } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import type { NavItem } from '@/components/layout/nav-config';
import {
  ADMIN_NAV_ITEMS,
  MANAGER_NAV_ITEMS,
  PUBLIC_NAV_ITEMS,
  USER_NAV_ITEMS,
} from '@/components/layout/nav-config';
import { TopBarGuest } from '@/components/layout/top-bar-guest';
import { TopBarUser } from '@/components/layout/top-bar-user';
import { AnchorLink } from '@/components/anchor-link';
import DarkModeToggle from '@/components/dark-mode-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import Logo from '@/components/logo';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/context/auth-provider';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

type NavAnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  title: string;
  isSelected?: boolean;
};

/** A link in the horizontal desktop bar. */
const BarLink = ({
  title,
  isSelected,
  className,
  ...props
}: NavAnchorProps) => (
  <a
    {...props}
    aria-current={isSelected ? 'page' : undefined}
    className={cn(
      'rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
      // Solid primary rather than a tint: `--primary` is a bright green at 0.887 lightness, so `text-primary` on a
      // pale background fails contrast badly in light mode. `--primary-foreground` is black in both themes, which is
      // why the sidebar this replaced used the same solid treatment for its active item.
      isSelected
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      className,
    )}
  >
    {title}
  </a>
);

const TanStackBarLink = createLink(BarLink);

const BarNavLink: LinkComponent<typeof TanStackBarLink> = (props) => (
  <TanStackBarLink
    preload="intent"
    activeProps={{ isSelected: true }}
    {...props}
  />
);

type IconAnchorProps = NavAnchorProps & { icon: LucideIcon };

/** A link inside a desktop dropdown, or inside the mobile sheet. */
const PanelLink = ({
  title,
  isSelected,
  icon: Icon,
  className,
  ...props
}: IconAnchorProps) => (
  <a
    {...props}
    aria-current={isSelected ? 'page' : undefined}
    className={cn(
      'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
      isSelected
        ? 'bg-primary text-primary-foreground'
        : 'text-foreground hover:bg-accent hover:text-accent-foreground',
      className,
    )}
  >
    <Icon
      className={cn(
        'size-4.5 shrink-0',
        !isSelected && 'text-muted-foreground',
      )}
    />
    <span className="truncate">{title}</span>
  </a>
);

const TanStackPanelLink = createLink(PanelLink);

const PanelNavLink: LinkComponent<typeof TanStackPanelLink> = (props) => (
  <TanStackPanelLink
    preload="intent"
    activeProps={{ isSelected: true }}
    {...props}
  />
);

/**
 * A staff-only group rendered as a dropdown rather than as flat links.
 *
 * <p>Kept as its own labeled group, even with one item per tier today, so a future addition to either tier
 * (a second manager or admin destination) has somewhere to land without restructuring the bar.
 */
function NavGroupMenu({
  label,
  items,
}: {
  readonly label: string;
  readonly items: ReadonlyArray<NavItem>;
}) {
  const { t } = useTranslation();
  const matchRoute = useMatchRoute();
  // `fuzzy` mirrors the partial matching `Link` uses for its own active state, so a child route such as
  // `/users/$userId` still lights up the group it belongs to.
  const isActive = items.some((item) =>
    matchRoute({ to: item.to, fuzzy: true }),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className={cn(
              'h-auto px-3 py-1.5 text-sm font-medium',
              isActive
                ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          />
        }
      >
        {label}
        <ChevronDown className="size-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="min-w-44 p-1"
      >
        {items.map((item) => (
          <DropdownMenuItem
            key={item.to}
            className="p-0"
            render={
              <PanelNavLink
                to={item.to}
                title={t(item.titleKey)}
                icon={item.icon}
                className="w-full"
              />
            }
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SheetSection({
  label,
  items,
  onNavigate,
}: {
  readonly label?: string;
  readonly items: ReadonlyArray<NavItem>;
  readonly onNavigate: () => void;
}) {
  const { t } = useTranslation();

  if (items.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-col gap-0.5">
      {label && (
        <p className="px-2.5 pt-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
      )}
      {items.map((item) => (
        <PanelNavLink
          key={item.to}
          to={item.to}
          title={t(item.titleKey)}
          icon={item.icon}
          onClick={onNavigate}
        />
      ))}
    </div>
  );
}

/**
 * The application's single navigation surface, on every route and at the top on every viewport.
 *
 * <p>It renders for anonymous visitors too, which is why it lives at the root rather than inside the `_auth`
 * layout: the feed is browsable without an account, so the same bar has to carry both the sign-in buttons
 * and the signed-in account menu.
 */
export function TopNav() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // `user`, not `accessToken`: the server-resolved snapshot (`lib/server-auth.ts`) always nulls
  // the token, so gating on it would render this global, always-server-rendered bar as anonymous
  // for every signed-in visitor on every page. See `_auth.tsx` for the same rule on route guards.
  const isAuthenticated = Boolean(user);
  const isManager =
    user?.roles.includes('ROLE_MANAGER') || user?.roles.includes('ROLE_ADMIN');
  const isAdmin = user?.roles.includes('ROLE_ADMIN');

  const primaryItems = isAuthenticated
    ? [...USER_NAV_ITEMS, ...PUBLIC_NAV_ITEMS]
    : PUBLIC_NAV_ITEMS;
  const managerItems = isManager ? MANAGER_NAV_ITEMS : [];
  const adminItems = isAdmin ? ADMIN_NAV_ITEMS : [];

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 supports-backdrop-filter:bg-background/80 supports-backdrop-filter:backdrop-blur">
      <nav
        aria-label={t('mainNavigation')}
        className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-3 lg:px-4"
      >
        {/* `/` is the public feed, for every visitor, signed in or not: the wordmark always leads there rather
            than to a signed-in dashboard. A signed-in author's own posts stay one click away instead, in
            `USER_NAV_ITEMS`'s "Dashboard" entry - the wordmark needs its own distinct label so a
            screen-reader user does not hear the same label announce two different destinations. */}
        <AnchorLink
          to="/"
          preload="intent"
          className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-label={t('wordmarkHome')}
        >
          <Logo logoClassName="size-8" />
        </AnchorLink>

        {/* `lg`, not `md`: at 768px a staff bar (Home + the two role dropdowns) needs ~590px against the ~410px
            this row has once the right-hand cluster is accounted for, so the links overflow rather than wrap.
            `lg` leaves enough room even for an ADMIN. */}
        <div className="hidden min-w-0 flex-1 items-center gap-0.5 lg:flex">
          {primaryItems.map((item) => (
            <BarNavLink key={item.to} to={item.to} title={t(item.titleKey)} />
          ))}
          {managerItems.length > 0 && (
            <NavGroupMenu label={t('management')} items={managerItems} />
          )}
          {adminItems.length > 0 && (
            <NavGroupMenu label={t('administration')} items={adminItems} />
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 lg:ml-0">
          {isAuthenticated && (
            <AnchorLink
              to="/write"
              preload="intent"
              className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'gap-1.5')}
            >
              <PenLine className="size-4" />
              <span className="hidden sm:inline">{t('write')}</span>
            </AnchorLink>
          )}
          <DarkModeToggle />
          <div className="hidden lg:flex">
            <LanguageSwitcher />
          </div>

          {isAuthenticated ? <TopBarUser /> : <TopBarGuest />}

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label={t('menu')}
                />
              }
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="top" className="max-h-svh overflow-y-auto">
              <SheetHeader className="pb-0">
                <SheetTitle>{t('menu')}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-4 pb-4">
                <SheetSection items={primaryItems} onNavigate={closeMenu} />
                <SheetSection
                  label={t('management')}
                  items={managerItems}
                  onNavigate={closeMenu}
                />
                <SheetSection
                  label={t('administration')}
                  items={adminItems}
                  onNavigate={closeMenu}
                />

                {/* Rendered only for anonymous visitors: `LanguageSwitcher` returns null once signed in (language then
                    comes from the profile), so for a signed-in user this row would be an empty bordered strip.
                    `TopBarGuest` itself is not repeated here: it renders as one icon button in the bar at every
                    viewport now, not just at `lg`, so a copy in the sheet would just be a second way to reach it. */}
                {!isAuthenticated && (
                  <div className="mt-3 border-t pt-3">
                    <LanguageSwitcher />
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
