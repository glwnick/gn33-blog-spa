import type { FC } from 'react';
import { cn } from '@/lib/utils';

/**
 * A yarn's colour dot. `hex` is nullable throughout - a maker can name a yarn without choosing a swatch - so the
 * fallback is a muted fill rather than an inline `background-color` of `null`, which renders as a transparent
 * hole indistinguishable from a missing element.
 */
export const YarnSwatch: FC<{
  readonly hex: string | null;
  readonly className?: string;
}> = ({ hex, className }) => (
  <span
    aria-hidden
    className={cn(
      'inline-block shrink-0 rounded-full ring-1 ring-foreground/15',
      !hex && 'bg-muted',
      className,
    )}
    style={hex ? { backgroundColor: hex } : undefined}
  />
);
