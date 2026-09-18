import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Download, ShieldAlert, Trash2 } from 'lucide-react';
import { AppContent } from '@/components/layout/app-content';
import { useAuth } from '@/context/auth-provider';
import { useTranslation } from '@/hooks/use-translation';
import { FlexibleCards } from '@/components/layout/felxible-cards';
import { ProfileLayout } from '@/components/profile-layout';
import { ProfileLayoutSkeleton } from '@/components/profile-layout-skeleton';
import { prefetchProfileIdentity } from '@/components/profile-identity-card';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { HeaderAlert } from '@/components/header-alert';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAlertMutation } from '@/hooks/use-alert-mutation';
import { deleteMyAccount } from '@/api/gdpr';
import { useExportMyDataMutation } from '@/query-options/gdpr-options';
import { saveBlobAsFile } from '@/lib/save-blob-as-file';

export const Route = createFileRoute('/_auth/profile/privacy')({
  loader: ({ context }) =>
    prefetchProfileIdentity(context.queryClient, context.auth.user!.userId),
  component: Privacy,
});

const STAFF_ROLES = new Set(['ROLE_MANAGER', 'ROLE_ADMIN']);

function Privacy() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <AppContent
      title={t('privacyAndData')}
      isPending={!user}
      fallback={
        <ProfileLayoutSkeleton
          cards={[
            { width: 'w-80', height: 'h-36' },
            { width: 'w-80', height: 'h-40' },
          ]}
        />
      }
    >
      <ProfileLayout>
        <FlexibleCards>
          <ExportDataCard />
          {user && <DeleteAccountCard />}
        </FlexibleCards>
      </ProfileLayout>
    </AppContent>
  );
}

function ExportDataCard() {
  const { t } = useTranslation();
  const { mutate, isPending } = useExportMyDataMutation();

  const handleExport = () => {
    mutate(undefined, {
      onSuccess: (blob) => {
        const today = new Date().toISOString().slice(0, 10);
        saveBlobAsFile(blob, `gn33-blog-data-export-${today}.zip`);
      },
      onError: () => {
        toast.error(t('exportDataError'));
      },
    });
  };

  return (
    <Card className="max-w-sm h-fit w-full break-inside-avoid mb-4">
      <CardHeader>
        <CardTitle>
          <Download className="mr-2 inline" size="20" />
          {t('exportMyData')}
        </CardTitle>
        <CardDescription>{t('exportMyDataHint')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleExport} disabled={isPending}>
          {isPending ? t('exporting') : t('downloadMyData')}
        </Button>
      </CardContent>
    </Card>
  );
}

function DeleteAccountCard() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');

  const isStaff = (user?.roles ?? []).some((role) => STAFF_ROLES.has(role));

  const {
    mutate,
    isPending,
    alertError,
    clearAlertError,
  } = useAlertMutation({
    mutationFn: deleteMyAccount,
    onSuccess: () => {
      logout();
      navigate({ to: '/login' });
      toast.success(t('accountDeletedFarewell'));
    },
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      clearAlertError();
    } else {
      setConfirmationEmail('');
    }
  };

  const matches =
    !!user?.email &&
    confirmationEmail.trim().toLowerCase() === user.email.toLowerCase();

  return (
    <Card className="max-w-sm h-fit w-full break-inside-avoid mb-4 ring-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">
          <Trash2 className="mr-2 inline" size="20" />
          {t('deleteMyAccount')}
        </CardTitle>
        <CardDescription>{t('deleteMyAccountHint')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isStaff && (
          <p className="text-sm text-muted-foreground">
            {t('deleteMyAccountStaffBlocked')}
          </p>
        )}
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
          <AlertDialogTrigger
            render={
              <Button variant="destructive" disabled={isStaff}>
                <Trash2 />
                {t('deleteMyAccount')}
              </Button>
            }
          />
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20">
                <ShieldAlert />
              </AlertDialogMedia>
              <AlertDialogTitle>
                {t('deleteMyAccountConfirmTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('deleteMyAccountConfirmDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <HeaderAlert error={alertError} />
            <Field>
              <FieldLabel htmlFor="delete-account-email">
                {t('deleteMyAccountTypeEmail', { var: user?.email ?? '' })}
              </FieldLabel>
              <Input
                id="delete-account-email"
                type="email"
                value={confirmationEmail}
                autoComplete="off"
                onChange={(e) => setConfirmationEmail(e.target.value)}
              />
            </Field>
            <AlertDialogFooter>
              <AlertDialogCancel variant="outline">
                {t('no')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  mutate({ confirmationEmail: confirmationEmail.trim() })
                }
                disabled={!matches || isPending}
                variant="destructive"
              >
                {t('yes')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
