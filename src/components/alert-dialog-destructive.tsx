import { Trash2 } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';

type AlertDialogDestructiveProps = {
  triggerButton?: React.ReactElement;
  buttonContent?: React.ReactNode;
  buttonAriaLabel?: string;
  title: string;
  description: string;
  action: () => void;
};

export const AlertDialogDestructive: FC<AlertDialogDestructiveProps> = ({
  triggerButton,
  buttonContent,
  buttonAriaLabel,
  title,
  description,
  action,
}) => {
  const { t } = useTranslation();
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          triggerButton ? (
            triggerButton
          ) : (
            <Button variant="destructive" aria-label={buttonAriaLabel}>
              {buttonContent}
            </Button>
          )
        }
      />
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">{t('no')}</AlertDialogCancel>
          <AlertDialogAction onClick={action} variant="destructive">
            {t('yes')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
