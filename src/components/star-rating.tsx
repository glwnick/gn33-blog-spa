import { Star } from 'lucide-react';
import { useState } from 'react';
import type { FC } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

type StarRatingProps = {
  readonly rating: number;
  readonly className?: string;
};

/**
 * Read-only 5-star display supporting fractional ratings (e.g. 4.3) by
 * clipping a filled star row over an empty one.
 */
export const StarRating: FC<StarRatingProps> = ({ rating, className }) => {
  const clamped = Math.min(Math.max(rating, 0), 5);
  return (
    <span
      role="img"
      aria-label={`${clamped.toFixed(1)}/5`}
      // w-fit stops flex parents from stretching the box, which would widen the clip overlay.
      className={cn('relative inline-flex w-fit', className)}
    >
      <span className="flex">
        {STAR_VALUES.map((value) => (
          <Star key={value} className="size-4 text-muted-foreground/40" />
        ))}
      </span>
      <span
        className="absolute inset-0 flex overflow-hidden"
        style={{ width: `${(clamped / 5) * 100}%` }}
      >
        {STAR_VALUES.map((value) => (
          <Star
            key={value}
            className="size-4 shrink-0 fill-amber-400 text-amber-400"
          />
        ))}
      </span>
    </span>
  );
};

type StarRatingInputProps = {
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly disabled?: boolean;
};

/** Interactive 1-5 star picker with hover preview. */
export const StarRatingInput: FC<StarRatingInputProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;
  return (
    <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
      {STAR_VALUES.map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          aria-label={t('rateStars', { count: star })}
          aria-pressed={value === star}
          onMouseEnter={() => setHovered(star)}
          onFocus={() => setHovered(star)}
          onBlur={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="cursor-pointer rounded-sm transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Star
            className={cn(
              'size-6 transition-colors',
              star <= shown
                ? 'fill-amber-400 text-amber-400'
                : 'text-muted-foreground/40',
            )}
          />
        </button>
      ))}
    </div>
  );
};
