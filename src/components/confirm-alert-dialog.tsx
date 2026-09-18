import { AlertCircle } from 'lucide-react';
import type { FC } from 'react';
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
import { useTranslation } from '@/hooks/use-translation';

type ConfirmAlertDialogProps = {
  readonly triggerButton: React.ReactElement;
  readonly title: string;
  readonly description: string;
  readonly action: () => void;
};

/**
 * A reusable confirmation alert dialog that accepts a fully customizable trigger button.
 * Uses the primary theme colors instead of the destructive/red theme.
 */
export const ConfirmAlertDialog: FC<ConfirmAlertDialogProps> = ({
  triggerButton,
  title,
  description,
  action,
}) => {
  const { t } = useTranslation();
  return (
    <AlertDialog>
      <AlertDialogTrigger render={triggerButton} />
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-primary/10 text-primary">
            <AlertCircle />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">{t('no')}</AlertDialogCancel>
          <AlertDialogAction onClick={action}>{t('yes')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
