import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, XIcon } from 'lucide-react';
import type { ProductImage } from '@/schemas/products';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { GalleryControlButton } from '@/pages/shop/gallery-control-button';
import { useTranslation } from '@/hooks/use-translation';
import { productImageSrc } from '@/lib/product-image-src';
import { cn } from '@/lib/utils';

// Falls back to a centred origin rather than dividing by zero when the image hasn't laid out yet (no explicit
// width/height, so `object-contain` has nothing to size against until the browser knows its intrinsic
// dimensions) - a `0`-size `getBoundingClientRect` would otherwise turn into an invalid `Infinity%`/`NaN%`
// transform-origin that the browser silently drops.
export function originFor(clientX: number, clientY: number, rect: DOMRect): string {
  if (rect.width === 0 || rect.height === 0) return '50% 50%';
  const x = ((clientX - rect.left) / rect.width) * 100;
  const y = ((clientY - rect.top) / rect.height) * 100;
  return `${x}% ${y}%`;
}

/**
 * Full-screen viewer opened from the product gallery's zoom button. Navigation (`onNavigate`) is the same
 * `goToImage` the inline gallery uses, so closing the lightbox always leaves the thumbnail strip/dots pointed
 * at whatever photo was last shown here - there is no separate index to keep in sync.
 *
 * Zoom itself is a click-to-toggle magnification centred on the click point, not a separate "zoom mode" - one
 * click in gets a closer look at stitch/fabric detail, following the pointer while zoomed (mouse move on
 * desktop, drag on touch); a second click (or moving to the next photo) drops back to the fitted view.
 */
export function ImageLightbox({
  images,
  index,
  open,
  onOpenChange,
  onNavigate,
}: {
  images: Array<ProductImage>;
  index: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (index: number) => void;
}) {
  const { t } = useTranslation();
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  // Throttles the pointer-follow to at most one `setOrigin` per animation frame - the same pattern the inline
  // gallery's own scroll listener uses - so a fast mousemove/touchmove burst doesn't re-render on every raw
  // event while panning a zoomed photo.
  const rafRef = useRef(0);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // A zoomed-in view carried over to the next photo (or the next time the lightbox opens) would show a
  // cropped detail the shopper never asked to see, so drop back to the fitted view whenever either changes.
  useEffect(() => {
    setZoomed(false);
  }, [index, open]);

  const image = images.at(index);

  const schedulePan = (clientX: number, clientY: number, rect: DOMRect) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setOrigin(originFor(clientX, clientY, rect)));
  };

  if (!image) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            onNavigate(index - 1);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            onNavigate(index + 1);
          }
        }}
        className="flex h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-5xl items-center justify-center overflow-hidden border-none bg-transparent p-0 shadow-none ring-0 sm:max-w-5xl"
      >
        <DialogTitle className="sr-only">{t('shopProductGallery')}</DialogTitle>
        <div className="relative flex size-full items-center justify-center overflow-hidden">
          <img
            key={image.url}
            src={productImageSrc(image.url)}
            alt={image.altText}
            onClick={(e) => {
              if (zoomed) {
                setZoomed(false);
                return;
              }
              setOrigin(originFor(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect()));
              setZoomed(true);
            }}
            onMouseMove={(e) => {
              if (zoomed) schedulePan(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
            }}
            onTouchMove={(e) => {
              // React's own `TouchList` type declares its index signature as always returning a `Touch`, so
              // the empty-list case (a lifted finger mid-gesture is a real, if rare, one) has to be a length
              // check up front rather than a truthiness check on `e.touches[0]` itself.
              if (!zoomed || e.touches.length === 0) return;
              const touch = e.touches[0];
              schedulePan(touch.clientX, touch.clientY, e.currentTarget.getBoundingClientRect());
            }}
            style={{ transformOrigin: origin }}
            className={cn(
              'max-h-full max-w-full touch-none object-contain transition-transform duration-200',
              zoomed ? 'scale-[2.5] cursor-zoom-out' : 'cursor-zoom-in',
            )}
          />
        </div>

        <DialogClose render={<GalleryControlButton className="absolute top-3 right-3 size-9" />}>
          <XIcon className="size-5" />
          <span className="sr-only">{t('close')}</span>
        </DialogClose>

        {images.length > 1 && (
          <>
            <GalleryControlButton
              aria-label={t('shopPreviousImage')}
              onClick={() => onNavigate(index - 1)}
              className="absolute top-1/2 left-3 size-10 -translate-y-1/2"
            >
              <ChevronLeft className="size-5" />
            </GalleryControlButton>
            <GalleryControlButton
              aria-label={t('shopNextImage')}
              onClick={() => onNavigate(index + 1)}
              className="absolute top-1/2 right-3 size-10 -translate-y-1/2"
            >
              <ChevronRight className="size-5" />
            </GalleryControlButton>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
              {index + 1} / {images.length}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
