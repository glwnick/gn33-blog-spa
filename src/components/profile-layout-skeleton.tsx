import { Card, CardContent } from '@/components/ui/card';
import { FlexibleCardsSkeleton } from '@/components/layout/flexible-cards-skeleton';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * `ProfileLayout`'s own shape (`components/profile-layout.tsx`): a sticky identity card on the left, a tab row
 * plus page-specific cards on the right. Used as the `AppContent` `fallback` on `/profile`, `/profile/security`
 * and `/profile/privacy` instead of the generic dashboard skeleton, which has no left rail and a completely
 * different card arrangement. Callers pass one size per real card their own page renders below the tab row.
 */
export function ProfileLayoutSkeleton({
  cards,
}: {
  readonly cards: ReadonlyArray<{ readonly width: string; readonly height: string }>;
}) {
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]" aria-busy="true">
      <div className="lg:sticky lg:top-20 lg:h-fit">
        <Card className="items-center px-4 text-center">
          <CardContent className="flex w-full flex-col items-center gap-3 px-0">
            <Skeleton className="size-22 rounded-xl" />
            <div className="flex w-full flex-col items-center gap-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
            <Separator />
            <div className="grid w-full grid-cols-2 gap-3">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex gap-5 border-b border-border pb-3">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <FlexibleCardsSkeleton cards={cards} />
      </div>
    </div>
  );
}
