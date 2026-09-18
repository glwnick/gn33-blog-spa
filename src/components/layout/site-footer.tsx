import { createLink } from '@tanstack/react-router';
import { FOOTER_NAV_ITEMS } from '@/components/layout/nav-config';
import LEGAL_INFO from '@/config/legal-info';
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
 * The site-wide footer, carrying the legal links and business identification data that used to
 * live in the top bar. See `nav-config.ts`'s `PUBLIC_NAV_ITEMS` for why they moved: a shop's top
 * bar should lead with product, not with terms.
 *
 * <p>Business identity, the ANPC notice and the SAL entity come from `config/legal-info.ts`
 * rather than a translation key, for the same reason `contact-info.ts` is separate: this is
 * business data, not copy, and today it is placeholder data pending Phase 0 (see that file).
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

        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <p>
            {t('footerBusinessIdentity', {
              name: LEGAL_INFO.registeredName,
              registrationNumber: LEGAL_INFO.registrationNumber,
              cui: LEGAL_INFO.cui,
              registeredOffice: LEGAL_INFO.registeredOffice,
            })}
          </p>
          <p>
            {t('footerAnpc')}{' '}
            <a
              href={LEGAL_INFO.anpcUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              anpc.ro
            </a>
          </p>
          {LEGAL_INFO.salEntity === null && <p>{t('footerSalPending')}</p>}
          <p>{t('footerCopyright', { year, name: LEGAL_INFO.registeredName })}</p>
        </div>
      </div>
    </footer>
  );
}
