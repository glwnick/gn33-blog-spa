import { createLink } from '@tanstack/react-router';
import { FOOTER_NAV_ITEMS } from '@/components/layout/nav-config';
import { BRAND_NAME } from '@/config/brand';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

/**
 * A footer link styled as plain text with an underline on hover.
 *
 * <p>A real anchor rather than `ButtonLink`: `ButtonLink` renders `<button href="...">` because base-ui's `Button`
 * is a `<button>`, which is wrong for something that is really a link (see `top-nav.tsx`'s `PlainNavLink`).
 */
const FooterNavLink = createLink(
  ({ className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      {...props}
      className={cn(
        'text-muted-foreground underline-offset-4 hover:text-foreground hover:underline',
        className,
      )}
    />
  ),
);

/**
 * The site-wide footer: the legal links plus the copyright line. The brand name is a placeholder, see
 * `config/brand.ts`.
 */
export function SiteFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-3 py-6 md:px-4">
        <nav aria-label={t('footerLegalLinks')} className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {FOOTER_NAV_ITEMS.map((item) => (
            <FooterNavLink key={item.to} to={item.to}>
              {t(item.titleKey)}
            </FooterNavLink>
          ))}
        </nav>

        <p className="text-xs text-muted-foreground">
          {t('footerCopyright', { year, name: BRAND_NAME })}
        </p>
      </div>
    </footer>
  );
}
