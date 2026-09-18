import { createLink } from '@tanstack/react-router';
import type { LinkComponent } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

type TabAnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  isSelected?: boolean;
};

/**
 * Real `<a>` tags styled as an underlined tab row, not `ButtonLink` - same reasoning as `top-nav.tsx`'s
 * `BarLink`: these are real navigations between `/profile`, `/profile/security` and `/profile/privacy`.
 */
const TabAnchor = ({ isSelected, className, ...props }: TabAnchorProps) => (
  <a
    {...props}
    aria-current={isSelected ? 'page' : undefined}
    className={cn(
      '-mb-px border-b-2 px-1 pb-3 text-sm font-medium whitespace-nowrap transition-colors',
      isSelected
        ? 'border-primary text-foreground'
        : 'border-transparent text-muted-foreground hover:text-foreground',
      className,
    )}
  />
);

const TanStackTabLink = createLink(TabAnchor);

const TabLink: LinkComponent<typeof TanStackTabLink> = (props) => (
  <TanStackTabLink activeProps={{ isSelected: true }} {...props} />
);

/** Shared by all three account routes so switching sections keeps the identity card and tab row in place. */
export function ProfileTabs() {
  const { t } = useTranslation();

  return (
    <div className="flex gap-5 border-b border-border">
      <TabLink to="/profile" activeOptions={{ exact: true }}>
        {t('details')}
      </TabLink>
      <TabLink to="/profile/security">{t('security')}</TabLink>
      <TabLink to="/profile/privacy">{t('privacyAndData')}</TabLink>
    </div>
  );
}
