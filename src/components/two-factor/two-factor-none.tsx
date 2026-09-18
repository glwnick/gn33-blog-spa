import { useState } from 'react';
import { ShieldBan } from 'lucide-react';
import type { FC } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { TwFactorBadge } from '@/components/two-factor/two-factor-badge';

type TwFactorNoneProps = {
  open: boolean;
  cancelAction: () => void;
  confirmAction: () => void;
  twoFactorType?: string;
};

export const TwFactorNone: FC<TwFactorNoneProps> = ({
  open,
  cancelAction,
  confirmAction,
  twoFactorType,
}) => {
  const [openDialog, setOpenDialog] = useState(open);
  const { t } = useTranslation();
  return (
    <>
      <div className="flex justify-center items-center">
        {!openDialog && (
          <TwFactorBadge
            icon={<ShieldBan className="size-12 text-destructive" />}
            title={t('twoFactorAuthDisabled')}
          />
        )}
      </div>

      <Dialog
        open={openDialog}
        onOpenChange={() => {
          setOpenDialog(false);
          cancelAction();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('areYouAbsolutelySure')}</DialogTitle>
            <DialogDescription>
              {t('thisActionWillDisable', { var: twoFactorType })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                confirmAction();
                setOpenDialog(false);
              }}
            >
              {t('yesImSure')}
            </Button>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setOpenDialog(false);
                    cancelAction();
                  }}
                >
                  {t('close')}
                </Button>
              }
            ></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
