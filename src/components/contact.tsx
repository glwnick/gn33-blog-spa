import { Mail, Phone } from 'lucide-react';
import { FacebookIcon, InstagramIcon } from '@/assets/svg/svgLogos';
import CONTACT_INFO from '@/config/contact-info';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';

type ReachRowProps = {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly href: string;
  readonly value: string;
};

const ReachRow = ({ icon, label, href, value }: ReachRowProps) => {
  // Only real web links open in a new tab: mailto:/tel: hand off to the OS, and
  // target="_blank" on those leaves a stray blank tab behind in some browsers.
  const isWebLink = href.startsWith('http');

  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <a
          href={href}
          {...(isWebLink && { target: '_blank', rel: 'noopener noreferrer' })}
          className="truncate text-sm font-medium hover:text-primary-strong"
        >
          {value}
        </a>
      </div>
    </div>
  );
};

export const Contact = () => {
  const { t } = useTranslation();

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4 px-4 py-8 mx-auto">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold">{t('contactPageTitle')}</h1>
        <p className="text-muted-foreground">{t('contactPageIntro')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('contactReachUs')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ReachRow
            icon={<Mail className="size-4" />}
            label={t('email')}
            href={`mailto:${CONTACT_INFO.email}`}
            value={CONTACT_INFO.email}
          />
          <ReachRow
            icon={<Phone className="size-4" />}
            label={t('phoneNumber')}
            href={`tel:${CONTACT_INFO.phone.replaceAll(' ', '')}`}
            value={CONTACT_INFO.phone}
          />
          <ReachRow
            icon={<InstagramIcon />}
            label={t('contactInstagram')}
            href={CONTACT_INFO.instagramUrl}
            value={CONTACT_INFO.instagramUrl.replace('https://', '')}
          />
          <ReachRow
            icon={<FacebookIcon />}
            label={t('contactFacebook')}
            href={CONTACT_INFO.facebookUrl}
            value={CONTACT_INFO.facebookUrl.replace('https://', '')}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('contactOpeningHours')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
          <p>{t('contactHoursWeekdays')}</p>
          <p>{t('contactHoursWeekend')}</p>
        </CardContent>
      </Card>

    </div>
  );
};
