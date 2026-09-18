import { AppContent } from '@/components/layout/app-content';
import { LegalDocumentEditor } from '@/pages/settings/legal-document-editor';
import { useTranslation } from '@/hooks/use-translation';

/** Legal documents are the only admin-wide setting left - the order-cancellation window and seasonal
 * batches sections it once sat alongside went with the e-commerce domain, and nothing has replaced them
 * yet, so there is no longer a second section to switch between. */
export function SettingsPage() {
  const { t } = useTranslation();

  return (
    <AppContent title={t('settings')}>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <LegalDocumentEditor type="TERMS" titleKey="termsAndConditions" />
        <LegalDocumentEditor type="GDPR" titleKey="gdprConsent" />
      </div>
    </AppContent>
  );
}
