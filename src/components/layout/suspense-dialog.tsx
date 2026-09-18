import { Suspense, useRef } from 'react';
import type { FC, ReactElement, ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import {
  DrawerContainerContext,
  ResponsiveDialogContext,
} from '@/components/ui/responsive-dialog';
import { LoadingContent } from '@/components/layout/loading-content';

type ISuspenseDialogProps = {
  openDialog: boolean;
  setOpenDialog: (open: boolean) => void;
  children: ReactNode;
  triggerButton?: ReactElement;
};

/**
 * Form-dialog wrapper: a centred Dialog on desktop, a bottom Drawer on
 * mobile. Wraps children in a Suspense boundary so lazy-loaded form content
 * can show a loading skeleton while loading, and provides the same
 * ResponsiveDialogContext that ResponsiveDialogHeader/Footer/Title read, so
 * forms using those (event/location/room forms) get the matching Drawer
 * header/footer on mobile instead of always rendering the desktop variant.
 * Also provides DrawerContainerContext (a ref to the Drawer's own content
 * element) so nested Select/Popover/Combobox fields portal inside the
 * Drawer instead of to document.body - otherwise vaul's focus trap yanks
 * focus back out of the portaled popup the instant it opens, closing it
 * before it ever becomes visible.
 */
export const SuspenseDialog: FC<Readonly<ISuspenseDialogProps>> = ({
  openDialog,
  setOpenDialog,
  children,
  triggerButton,
}) => {
  const isMobile = useIsMobile();
  const drawerContainerRef = useRef<HTMLDivElement | null>(null);
  const content = (
    <ResponsiveDialogContext.Provider value={isMobile}>
      <DrawerContainerContext.Provider
        value={isMobile ? drawerContainerRef : null}
      >
        <Suspense fallback={<LoadingContent />}>{children}</Suspense>
      </DrawerContainerContext.Provider>
    </ResponsiveDialogContext.Provider>
  );

  if (isMobile) {
    return (
      <Drawer handleOnly open={openDialog} onOpenChange={setOpenDialog}>
        {triggerButton && (
          <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
        )}
        <DrawerContent ref={drawerContainerRef}>{content}</DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog
      disablePointerDismissal
      open={openDialog}
      onOpenChange={setOpenDialog}
    >
      {triggerButton && <DialogTrigger render={triggerButton} />}
      <DialogContent>{content}</DialogContent>
    </Dialog>
  );
};
