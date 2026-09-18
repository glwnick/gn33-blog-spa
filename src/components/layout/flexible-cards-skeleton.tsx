import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * A `FlexibleCards` (`components/layout/felxible-cards.tsx`) row rendered as skeleton blocks instead of real
 * cards - same flex-wrap layout, so the wrap points and gaps land in the same place once the real cards mount.
 * Callers pass one size per real card in reading order.
 */
export function FlexibleCardsSkeleton({
  cards,
}: {
  readonly cards: ReadonlyArray<{ readonly width: string; readonly height: string }>;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-start gap-4" aria-busy="true">
      {cards.map((card, i) => (
        <Skeleton key={i} className={cn('rounded-xl', card.width, card.height)} />
      ))}
    </div>
  );
}
