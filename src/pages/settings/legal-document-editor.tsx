import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, FileText } from 'lucide-react';
import type { FC } from 'react';
import type { LegalDocumentType } from '@/schemas/legal-document';
import { publishLegalDocument } from '@/api/legal-document-api';
import {
  ADMIN_LEGAL_DOCUMENT_KEY,
  LEGAL_DOCUMENT_KEY,
  LEGAL_DOCUMENT_VERSIONS_KEY,
  adminLegalDocumentOptions,
  legalDocumentVersionsOptions,
} from '@/query-options/legal-document-options';
import { useAlertMutation } from '@/hooks/use-alert-mutation';
import { useTranslation } from '@/hooks/use-translation';
import { HeaderAlert } from '@/components/header-alert';
import { Markdown } from '@/components/ui/markdown';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDate } from '@/lib/formatting';

type LegalDocumentEditorProps = {
  readonly type: LegalDocumentType;
  readonly titleKey: 'termsAndConditions' | 'gdprConsent';
};

export const LegalDocumentEditor: FC<LegalDocumentEditorProps> = ({
  type,
  titleKey,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: document, isLoading } = useQuery(
    adminLegalDocumentOptions(type),
  );
  const { data: versions } = useQuery(legalDocumentVersionsOptions(type));

  useEffect(() => {
    if (document) setContent(document.content);
  }, [document]);

  const {
    mutate: publishMutation,
    isPending,
    alertError,
    clearAlertError,
  } = useAlertMutation({
    mutationFn: () => publishLegalDocument(type, content),
    onSuccess: () => {
      toast.success(t('documentPublished'));
      queryClient.invalidateQueries({
        queryKey: [ADMIN_LEGAL_DOCUMENT_KEY, type],
      });
      queryClient.invalidateQueries({ queryKey: [LEGAL_DOCUMENT_KEY, type] });
      queryClient.invalidateQueries({
        queryKey: [LEGAL_DOCUMENT_VERSIONS_KEY, type],
      });
      setConfirmOpen(false);
    },
  });

  const isUnchanged = document?.content === content;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <FileText className="mr-2 inline" size="20" />
          {t(titleKey)}
        </CardTitle>
        <CardDescription>
          {document
            ? t('documentVersionInfo', {
                version: document.version,
                date: document.publishedAt
                  ? formatDate(document.publishedAt)
                  : '—',
              })
            : t('loading')}
        </CardDescription>
        <HeaderAlert error={alertError} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">
                {t('markdownContent')}
              </span>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-80 font-mono text-xs"
                placeholder={t('markdownContentPlaceholder')}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">{t('preview')}</span>
              <div className="min-h-80 overflow-auto rounded-md border bg-muted/30 p-3">
                {content.trim() ? (
                  <Markdown>{content}</Markdown>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t('previewEmpty')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        {versions && versions.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{t('versionHistory')}</span>
            <ul className="flex flex-col gap-1 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              {versions.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-x-2"
                >
                  <span>
                    {t('documentVersionInfo', {
                      version: entry.version,
                      date: entry.publishedAt
                        ? formatDate(entry.publishedAt)
                        : '—',
                    })}
                  </span>
                  {entry.publishedBy && <span>{entry.publishedBy}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex justify-end">
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <Button
              onClick={() => {
                clearAlertError();
                setConfirmOpen(true);
              }}
              disabled={
                isLoading || isPending || !content.trim() || isUnchanged
              }
            >
              {isPending && <Spinner />}
              {t('publish')}
            </Button>
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20">
                  <AlertTriangle />
                </AlertDialogMedia>
                <AlertDialogTitle>{t('publishConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('publishConfirmDescription')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel variant="outline">
                  {t('cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => publishMutation()}
                  disabled={isPending}
                >
                  {isPending && <Spinner />}
                  {t('publish')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};
