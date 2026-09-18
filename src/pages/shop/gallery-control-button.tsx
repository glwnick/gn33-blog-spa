import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared look for every circular icon control layered on top of a product photo - the inline gallery's
 * prev/next arrows and zoom trigger, plus the lightbox's close/prev/next. Consolidated here so a visual tweak
 * (hover background, backdrop blur strength) is one edit instead of five, and so a caller only supplies the
 * bits that actually differ: size, position and icon.
 */
export function GalleryControlButton({
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        'flex items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background',
        className,
      )}
      {...props}
    />
  );
}
