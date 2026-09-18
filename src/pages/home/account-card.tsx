import { Link } from '@tanstack/react-router';
import { ChevronRight, Mail, ShieldCheck, User } from 'lucide-react';
import type { LinkProps } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import type { TranslationKey } from '@/hooks/use-translation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';

type AccountLink = {
  readonly to: LinkProps['to'];
  readonly icon: LucideIcon;
  readonly titleKey: TranslationKey;
};

// Only destinations that actually exist. Addresses is missing on purpose: saved addresses are Phase 5
// (plans/PLAN-shop-surfaces.md slice 3's conflict 3), so there is no /profile/addresses route yet - see
// plans/PLAN-slice-5-member-home.md conflict 4.
const LINKS: ReadonlyArray<AccountLink> = [
  { to: '/profile', icon: User, titleKey: 'profile' },
  { to: '/profile/privacy', icon: ShieldCheck, titleKey: 'privacyAndData' },
  // Reachable while authenticated via AUTH_BYPASS_PATHS in routes/_no-auth.tsx.
  { to: '/contact', icon: Mail, titleKey: 'contact' },
];

/** The home dashboard's right column "Your account" card - a vertical list of shortcuts to the member surfaces. */
export function AccountCard() {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('homeAccountTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col divide-y">
        {LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center gap-3 py-2.5 text-sm transition-colors first:pt-0 last:pb-0 hover:text-primary-strong"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <link.icon className="size-4" />
            </span>
            <span className="flex-1 font-medium">{t(link.titleKey)}</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
