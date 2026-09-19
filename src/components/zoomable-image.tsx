import { XIcon } from 'lucide-react';
import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

type ZoomableImageProps = {
  readonly src: string;
  readonly alt: string;
  /** Classes for the thumbnail `<img>`; the full-size view is always shown uncropped. */
  readonly className?: string;
};

/** A thumbnail that opens the whole, uncropped picture in a dialog when clicked. */
export const ZoomableImage: FC<ZoomableImageProps> = ({
  src,
  alt,
  className,
}) => {
  const { t } = useTranslation();
  const label = alt
    ? `${t('viewFullImage')}: ${alt}`
    : t('viewFullImage');

  return (
    <Dialog>
      <DialogTrigger
        aria-label={label}
        // `group` so the focus ring is drawn on the image, following its own corner radius rather than the
        // button's (which has none: the radius lives on the img, not on any ancestor).
        className="group block w-full cursor-zoom-in outline-none"
        render={<button type="button" />}
      >
        <img
          src={src}
          alt={alt}
          className={cn(
            className,
            'group-focus-visible:ring-2 group-focus-visible:ring-ring',
          )}
        />
      </DialogTrigger>
      <DialogContent
        // Own close button: the stock one is a ghost button in the theme foreground, which disappears over a
        // light photo. This one carries its own dark backing so it reads on any image.
        showCloseButton={false}
        overlayClassName="bg-black/80"
        className="flex max-h-[95vh] w-auto max-w-[95vw] items-center justify-center bg-transparent p-0 ring-0 sm:max-w-[95vw]"
      >
        <DialogTitle className="sr-only">{alt || t('viewFullImage')}</DialogTitle>
        <img
          src={src}
          alt={alt}
          className="max-h-[95vh] max-w-[95vw] rounded-lg object-contain"
        />
        <DialogClose
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-2 right-2 bg-black/60 text-white hover:bg-black/80 hover:text-white"
            />
          }
        >
          <XIcon />
          <span className="sr-only">{t('close')}</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};
