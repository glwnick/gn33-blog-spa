import { Skeleton } from '@/components/ui/skeleton';

/**
 * Matches the shape `AllFeatureTable`/`DataTable` actually render: a toolbar (search box left, view-options
 * button right), a bordered table with a header row and body rows, then a pagination footer. Used as the
 * `AppContent` `fallback` for every admin table page instead of the generic dashboard-shaped `LoadingContent`,
 * which has nowhere near this many rows and reflows the whole page the moment the real table mounts.
 *
 * <p>`columns` defaults to 10 - both current call sites' actually-visible column count (`product-columns.tsx`'s
 * 9 data columns plus its actions column; `users/columns.tsx`'s 8 data columns, `createdDate` included via its
 * `initialColumnVisibility` override, plus its own selection checkbox and actions column). A future table with
 * a different visible column count should pass its own `columns` rather than drift against this default.
 */
export function TablePageSkeleton({
  rows = 6,
  columns = 10,
}: {
  readonly rows?: number;
  readonly columns?: number;
}) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="overflow-hidden rounded-lg border">
        <div className="flex items-center gap-4 border-b bg-muted/40 px-4 py-3">
          {Array.from({ length: columns }, (_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }, (_row, i) => (
          <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
            {Array.from({ length: columns }, (_col, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-48" />
      </div>
    </div>
  );
}
