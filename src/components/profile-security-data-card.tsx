import { Link } from '@tanstack/react-router';
import { ChevronRight, Lock, ShieldCheck } from 'lucide-react';
import type { LinkProps } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import type { TranslationKey } from '@/hooks/use-translation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';

type SecurityLink = {
  readonly to: LinkProps['to'];
  readonly icon: LucideIcon;
  readonly titleKey: TranslationKey;
};

const LINKS: ReadonlyArray<SecurityLink> = [
  { to: '/profile/security', icon: Lock, titleKey: 'security' },
  { to: '/profile/privacy', icon: ShieldCheck, titleKey: 'privacyAndData' },
];

/** The Details tab's shortcut card out to the other two account sections - modelled on the home dashboard's `AccountCard`. */
export function ProfileSecurityDataCard() {
  const { t } = useTranslation();

  return (
    <Card className="max-w-sm h-fit w-full break-inside-avoid mb-4">
      <CardHeader>
        <CardTitle>{t('profileSecurityAndData')}</CardTitle>
        <CardDescription>{t('profileSecurityAndDataHint')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col divide-y">
        {LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center gap-3 py-2.5 text-sm transition-colors first:pt-0 last:pb-0 hover:text-primary"
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
