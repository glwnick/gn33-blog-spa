import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { TranslationKey } from '@/hooks/use-translation';
import { AppContent } from '@/components/layout/app-content';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/use-translation';
import { appSettingsOptions } from '@/query-options/settings-options';
import { OrderCancellationSettingsCard } from '@/pages/settings/order-cancellation-settings-card';
import { SeasonalBatchesCard } from '@/pages/settings/seasonal-batches-card';
import { LegalDocumentEditor } from '@/pages/settings/legal-document-editor';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

// Only Orders and Legal documents have real content today. The handoff's other four sections (Delivery &
// zones, Payments, Legal documents' siblings, Notifications, Roles & access) are future phases - building
// placeholder tabs for them would be inventing UI for work that isn't planned yet.
const SECTIONS = [
  { id: 'orders', titleKey: 'settingsSectionOrders' },
  { id: 'legal', titleKey: 'settingsSectionLegal' },
] as const satisfies ReadonlyArray<{ id: string; titleKey: TranslationKey }>;

type SectionId = (typeof SECTIONS)[number]['id'];

export function SettingsPage() {
  const { t } = useTranslation();
  const { data: settings, isLoading } = useQuery(appSettingsOptions());
  const [section, setSection] = useState<SectionId>('orders');

  return (
    <AppContent
      title={t('settings')}
      isPending={isLoading || !settings}
      fallback={<SettingsPageSkeleton />}
    >
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
        <nav className="flex gap-2 md:sticky md:top-20 md:h-fit md:flex-col">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={cn(
                buttonVariants({
                  variant: section === item.id ? 'default' : 'ghost',
                  size: 'sm',
                }),
                'justify-start',
              )}
            >
              {t(item.titleKey)}
            </button>
          ))}
        </nav>

        <div className="flex flex-col gap-6">
          {section === 'orders' && (
            <>
              {settings && (
                // Keyed on the persisted value so the card's form resets to it after a save instead of
                // keeping the stale defaultValues it mounted with.
                <OrderCancellationSettingsCard
                  key={settings.orderCancellationWindowHours}
                  settings={settings}
                />
              )}
              <SeasonalBatchesCard />
            </>
          )}
          {section === 'legal' && (
            <>
              <LegalDocumentEditor type="TERMS" titleKey="termsAndConditions" />
              <LegalDocumentEditor type="GDPR" titleKey="gdprConsent" />
            </>
          )}
        </div>
      </div>
    </AppContent>
  );
}

/** Matches this page's own two-column section-switcher shape - see `pages/admin/library-page.tsx` for the
 * identical pattern reused there. */
function SettingsPageSkeleton() {
  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-[200px_1fr]" aria-busy="true">
      <div className="flex gap-2 md:flex-col">
        <Skeleton className="h-8 w-full max-w-32" />
        <Skeleton className="h-8 w-full max-w-32" />
      </div>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </div>
  );
}
