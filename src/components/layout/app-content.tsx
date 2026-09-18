import { Suspense } from 'react';
import type { FC } from 'react';
import { LoadingContent } from '@/components/layout/loading-content';

interface IProps {
  title: string | React.ReactNode;
  children: React.ReactNode;
  isPending?: boolean;
  /**
   * What to render instead of `children` while `isPending` is true, and as the Suspense boundary's own
   * fallback below. Defaults to the generic `LoadingContent` shape, but that shape is a dashboard-style guess
   * (a stat-card row plus two blocks) that only actually resembles a handful of pages. Anywhere the real
   * content has a distinctive shape - a table, a kanban board, a form, a centered card - pass a matching
   * skeleton here instead, so the page doesn't visibly reflow when the real content swaps in.
   *
   * <p>The Suspense boundary only ever catches a suspension raised by a descendant of `children` - most pages'
   * own `useSuspenseQuery`/`useSuspenseInfiniteQuery` call happens earlier, at the top of the page component,
   * before this element is even constructed, so it suspends an ancestor boundary outside `AppContent` instead
   * and never reaches this one. `fallback` reliably takes effect through the `isPending` prop; treat the
   * Suspense path as a bonus that only helps a component nested inside `children` that suspends on its own.
   */
  fallback?: React.ReactNode;
}

/**
 * The shell every in-app page renders into.
 *
 * <p>It no longer carries a bar of its own. The dark-mode toggle and the account menu moved to the global `TopNav`,
 * and stacking a second sticky bar under it just to hold a page title was wasting a fifth of a phone's viewport.
 * A string title is rendered as the page's `h1`, which these pages previously did not have at all.
 */
export const AppContent: FC<IProps> = ({ title, children, isPending, fallback = <LoadingContent /> }) => {
  return (
    <Suspense fallback={fallback}>
      <main className="mx-auto w-full max-w-7xl px-3 py-4 md:px-4 md:py-6">
        <div className="mb-4">
          {typeof title === 'string' ? (
            <h1 className="truncate text-xl font-semibold tracking-tight">
              {title}
            </h1>
          ) : (
            title
          )}
        </div>
        {isPending ? fallback : children}
      </main>
    </Suspense>
  );
};
