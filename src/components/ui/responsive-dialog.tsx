import * as React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

/**
 * Shared context so every Responsive* child uses the same isMobile value
 * as the root, preventing mismatches during re-renders.
 */
const ResponsiveDialogContext = React.createContext<boolean>(false);

/**
 * How long to wait after a field is focused before scrolling it into view, so
 * the measurement happens once the virtual keyboard has finished animating in
 * and the viewport has resized. Roughly matches the ~250-300ms keyboard
 * transition on both iOS and Android.
 */
const KEYBOARD_SETTLE_MS = 300;

function useResponsiveDialog(): boolean {
  return React.useContext(ResponsiveDialogContext);
}

/**
 * Ref to the mobile Drawer's own content element, non-null only while inside
 * a Drawer. Vaul's Drawer traps focus within its DOM subtree; a nested
 * Select/Popover/Combobox that portals to `document.body` by default sits
 * outside that subtree, so focus moving into it gets yanked back by the trap
 * and the popup immediately dismisses itself before ever becoming visible.
 * Consumers pass this as the popup's own Portal `container` so it renders
 * inside the Drawer instead, keeping it within the focus trap's boundary.
 */
const DrawerContainerContext =
  React.createContext<React.RefObject<HTMLDivElement | null> | null>(null);

type ResponsiveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

/** Root wrapper — Dialog on desktop, Drawer (bottom sheet) on mobile. */
function ResponsiveDialog({
  open,
  onOpenChange,
  children,
}: Readonly<ResponsiveDialogProps>) {
  const isMobile = useIsMobile();
  const drawerContainerRef = React.useRef<HTMLDivElement | null>(null);
  const root = (
    <ResponsiveDialogContext.Provider value={isMobile}>
      <DrawerContainerContext.Provider
        value={isMobile ? drawerContainerRef : null}
      >
        {children}
      </DrawerContainerContext.Provider>
    </ResponsiveDialogContext.Provider>
  );

  if (isMobile) {
    return (
      <Drawer handleOnly open={open} onOpenChange={onOpenChange}>
        {root}
      </Drawer>
    );
  }
  return (
    <Dialog disablePointerDismissal open={open} onOpenChange={onOpenChange}>
      {root}
    </Dialog>
  );
}

type ResponsiveDialogTriggerProps = React.ComponentProps<'button'>;

/** Trigger button — maps to DialogTrigger / DrawerTrigger. */
function ResponsiveDialogTrigger({
  children,
  ...props
}: Readonly<ResponsiveDialogTriggerProps>) {
  const isMobile = useResponsiveDialog();
  if (isMobile) {
    return <DrawerTrigger {...props}>{children}</DrawerTrigger>;
  }
  return (
    <DialogTrigger render={<button type="button" {...props} />}>
      {children}
    </DialogTrigger>
  );
}

type ResponsiveDialogContentProps = React.ComponentProps<'div'> & {
  showCloseButton?: boolean;
};

/** Content wrapper — DialogContent on desktop, DrawerContent on mobile. */
function ResponsiveDialogContent({
  children,
  className,
  showCloseButton,
  ...props
}: Readonly<ResponsiveDialogContentProps>) {
  const isMobile = useResponsiveDialog();
  const drawerContainerRef = React.useContext(DrawerContainerContext);
  if (isMobile) {
    return (
      <DrawerContent ref={drawerContainerRef} className={className} {...props}>
        {children}
      </DrawerContent>
    );
  }
  return (
    <DialogContent
      className={className}
      showCloseButton={showCloseButton}
      {...props}
    >
      {children}
    </DialogContent>
  );
}

type ResponsiveDialogHeaderProps = React.ComponentProps<'div'>;

/** Header — DialogHeader on desktop, DrawerHeader on mobile. */
function ResponsiveDialogHeader({
  children,
  className,
  ...props
}: Readonly<ResponsiveDialogHeaderProps>) {
  const isMobile = useResponsiveDialog();
  if (isMobile) {
    return (
      <DrawerHeader className={className} {...props}>
        {children}
      </DrawerHeader>
    );
  }
  return (
    <DialogHeader className={className} {...props}>
      {children}
    </DialogHeader>
  );
}

type ResponsiveDialogBodyProps = React.ComponentProps<'div'> & {
  footer?: React.ReactNode;
};

/**
 * Scrollable form body, with the dialog's footer rendered beneath it.
 *
 * The footer is a prop rather than a sibling the caller places itself because
 * the two are one layout contract, not two independent pieces:
 *
 * - On mobile, DrawerContent is a flex column clamped to `max-h-[80vh]` with
 *   the default `overflow: visible`. The body therefore has to be the item
 *   that absorbs the clamp - `flex-1 min-h-0` on both this wrapper and the
 *   scroll container - or a long form simply overflows the drawer and pushes
 *   the footer's Save/Cancel buttons off-screen with nothing to scroll them
 *   back into reach. A fixed `max-h` on the scroll container cannot work here:
 *   it is chosen independently of the header and footer it has to share the
 *   80vh with, which is how a hardcoded `max-h-[60vh]` shipped broken here.
 * - On desktop, DialogContent is a `grid gap-4`, so body and footer must stay
 *   inside one grid item. DialogFooter is a full-bleed bar (`-mx-4 -mb-4
 *   border-t`) that expects to sit flush against the scroll area; as its own
 *   grid row it would gain a 16px gap above the border and detach.
 *
 * The `md:max-h` cap is the desktop-only counterpart, since the Dialog grid
 * has no height of its own to shrink against. It is `md:` and not `sm:` on
 * purpose: `useIsMobile` switches at 768px, so `sm:` (640px) would apply the
 * desktop cap to a drawer between 640 and 767px.
 */
function ResponsiveDialogBody({
  children,
  className,
  footer,
  ...props
}: Readonly<ResponsiveDialogBodyProps>) {
  const isMobile = useResponsiveDialog();
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  // Keep the focused field visible when the virtual keyboard opens over the
  // drawer. Deferred so it runs after the keyboard animation and viewport
  // resize have settled rather than against stale geometry; the pending timer
  // is tracked so it can be cancelled, since `scrollIntoView` walks every
  // scrollable ancestor and would otherwise still fire (scrolling the page
  // behind the drawer) if the field is blurred or the drawer closed within
  // the delay.
  React.useEffect(() => {
    if (!isMobile) return;
    const container = scrollRef.current;
    if (!container) return;

    let timeoutId: number | undefined;

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        if (!target.isConnected) return;
        target.scrollIntoView({ block: 'nearest' });
      }, KEYBOARD_SETTLE_MS);
    };

    container.addEventListener('focusin', handleFocusIn);
    return () => {
      window.clearTimeout(timeoutId);
      container.removeEventListener('focusin', handleFocusIn);
    };
  }, [isMobile]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className={cn(
          '-mx-4 min-h-0 flex-1 overflow-y-auto px-4 py-4 md:max-h-[calc(100dvh-13rem)] group-data-[vaul-drawer-direction=bottom]/drawer-content:mx-0',
          className,
        )}
        {...props}
      >
        {children}
      </div>
      {footer}
    </div>
  );
}

type ResponsiveDialogFooterProps = React.ComponentProps<'div'> & {
  showCloseButton?: boolean;
};

/** Footer — DialogFooter on desktop, DrawerFooter on mobile. */
function ResponsiveDialogFooter({
  children,
  className,
  showCloseButton,
  ...props
}: Readonly<ResponsiveDialogFooterProps>) {
  const isMobile = useResponsiveDialog();
  if (isMobile) {
    return (
      <DrawerFooter className={className} {...props}>
        {children}
      </DrawerFooter>
    );
  }
  return (
    <DialogFooter
      className={className}
      showCloseButton={showCloseButton}
      {...props}
    >
      {children}
    </DialogFooter>
  );
}

type ResponsiveDialogTitleProps = React.ComponentProps<'h2'>;

/** Title — DialogTitle on desktop, DrawerTitle on mobile. */
function ResponsiveDialogTitle({
  children,
  className,
  ...props
}: Readonly<ResponsiveDialogTitleProps>) {
  const isMobile = useResponsiveDialog();
  if (isMobile) {
    return (
      <DrawerTitle className={className} {...props}>
        {children}
      </DrawerTitle>
    );
  }
  return (
    <DialogTitle className={className} {...props}>
      {children}
    </DialogTitle>
  );
}

type ResponsiveDialogDescriptionProps = React.ComponentProps<'p'>;

/** Description — DialogDescription on desktop, DrawerDescription on mobile. */
function ResponsiveDialogDescription({
  children,
  className,
  ...props
}: Readonly<ResponsiveDialogDescriptionProps>) {
  const isMobile = useResponsiveDialog();
  if (isMobile) {
    return (
      <DrawerDescription className={className} {...props}>
        {children}
      </DrawerDescription>
    );
  }
  return (
    <DialogDescription className={className} {...props}>
      {children}
    </DialogDescription>
  );
}

type ResponsiveDialogCloseProps = React.ComponentProps<'button'>;

/** Close button — DialogClose on desktop, DrawerClose on mobile. */
function ResponsiveDialogClose({
  children,
  ...props
}: Readonly<ResponsiveDialogCloseProps>) {
  const isMobile = useResponsiveDialog();
  if (isMobile) {
    return <DrawerClose {...props}>{children}</DrawerClose>;
  }
  return <DialogClose {...props}>{children}</DialogClose>;
}

export {
  DrawerContainerContext,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogContext,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
};
