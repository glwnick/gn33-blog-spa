import { useQuery } from '@tanstack/react-query';
import type { LegalDocumentType } from '@/schemas/legal-document';
import { legalDocumentOptions } from '@/query-options/legal-document-options';
import { Button } from '@/components/ui/button';
import { Markdown } from '@/components/ui/markdown';
import { Spinner } from '@/components/ui/spinner';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { useTranslation } from '@/hooks/use-translation';

type LegalDocumentDialogProps = {
  readonly type: LegalDocumentType;
  readonly title: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
};

// Read-only viewer for the current published Terms/GDPR document, reused by the
// register wizard's Consents step; the /terms route has its own accept-flow copy.
export const LegalDocumentDialog = ({
  type,
  title,
  open,
  onOpenChange,
}: LegalDocumentDialogProps) => {
  const { t } = useTranslation();
  const { data } = useQuery({ ...legalDocumentOptions(type), enabled: open });

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <div className="max-h-[60vh] overflow-y-auto px-4 sm:px-0">
          {data ? (
            <Markdown>{data.content}</Markdown>
          ) : (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          )}
        </div>
        <ResponsiveDialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            {t('close')}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};
