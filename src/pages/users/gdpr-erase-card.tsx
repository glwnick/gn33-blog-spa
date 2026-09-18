import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShieldAlert, Trash2 } from 'lucide-react';
import type { FC } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HeaderAlert } from '@/components/header-alert';
import { useTranslation } from '@/hooks/use-translation';
import { useAlertMutation } from '@/hooks/use-alert-mutation';
import { gdprEraseUser } from '@/api/user-api';
import { USER_KEY, userOptions } from '@/query-options/user-options';
import { useAuth } from '@/context/auth-provider';
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
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type GdprEraseCardProps = {
  readonly userId: string;
};

/**
 * ADMIN-only offline GDPR erase action, reusing the same erasure service the member's
 * own self-service deletion uses. Hidden for staff targets (must be demoted first) and
 * for the admin's own account (self-erase goes through the member-facing privacy page,
 * not this admin action).
 */
export const GdprEraseCard: FC<GdprEraseCardProps> = ({ userId }) => {
  const { data: userDetails } = useQuery(userOptions(userId));
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('ROLE_ADMIN') ?? false;

  if (!userDetails || !isAdmin) return null;
  if (user?.userId === userId) return null;
  if (userDetails.userRoleType !== 'USER') return null;

  return (
    <GdprEraseForm
      userId={userId}
      email={userDetails.email}
      firstName={userDetails.firstName}
      lastName={userDetails.lastName}
    />
  );
};

type GdprEraseFormProps = {
  readonly userId: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
};

function GdprEraseForm({ userId, email, firstName, lastName }: GdprEraseFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');

  const {
    mutate,
    isPending,
    alertError,
    clearAlertError,
  } = useAlertMutation({
    mutationFn: () => gdprEraseUser(userId),
    onSuccess: async () => {
      setOpen(false);
      await queryClient.invalidateQueries(userOptions(userId));
      await queryClient.invalidateQueries({ queryKey: [USER_KEY] });
      toast.success(t('gdprEraseSuccess'));
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

  const matches = confirmationEmail.trim().toLowerCase() === email.toLowerCase();

  return (
    <Card className="max-w-sm h-fit w-full break-inside-avoid mb-4 ring-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">
          <Trash2 className="mr-2 inline" size="20" />
          {t('gdprErase')}
        </CardTitle>
        <CardDescription>{t('gdprEraseHint', { var: `${firstName} ${lastName}` })}</CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
          <AlertDialogTrigger
            render={
              <Button variant="destructive">
                <Trash2 />
                {t('gdprErase')}
              </Button>
            }
          />
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20">
                <ShieldAlert />
              </AlertDialogMedia>
              <AlertDialogTitle>{t('gdprEraseConfirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('gdprEraseConfirmDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <HeaderAlert error={alertError} />
            <Field>
              <FieldLabel htmlFor="gdpr-erase-email">
                {t('gdprEraseTypeEmail', { var: email })}
              </FieldLabel>
              <Input
                id="gdpr-erase-email"
                type="email"
                value={confirmationEmail}
                autoComplete="off"
                onChange={(e) => setConfirmationEmail(e.target.value)}
              />
            </Field>
            <AlertDialogFooter>
              <AlertDialogCancel variant="outline">{t('no')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => mutate()}
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
