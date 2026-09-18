import {
  columnOrderingFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createExpandedRowModel,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import type { BaseTableRow } from '@/types/pageable';

// The single feature set shared by every table in the app - there is exactly one table primitive
// (`DataTable`), so one `tableFeatures()` call covers it rather than each column-def file building its own.
// See PLAN-react-table-v9.md for the v8 -> v9 migration this is part of.
//
// What's registered and why:
// - rowSortingFeature / rowPaginationFeature: state and column/table APIs only. Every table here runs
//   `manualSorting`/`manualPagination` (the server does the real work), so their row-model slots
//   (`sortedRowModel`/`paginatedRowModel`) are deliberately NOT registered - nothing here ever asks the
//   table to compute those, the same way v8's `table.tsx` never called `getSortedRowModel()`/
//   `getPaginationRowModel()` either.
// - rowSelectionFeature: the bulk-action checkbox column (Users today, but shared plumbing).
// - rowExpandingFeature + expandedRowModel: sub-row expansion. Wired through `DataTable`'s props but not
//   used by either live caller yet.
// - columnPinningFeature: sticky "pin to start" columns.
// - columnSizingFeature: `column.getSize()`/`getStart()`, used by the pinning style calculation - pinning
//   alone doesn't carry a column's pixel offset, sizing does.
// - columnOrderingFeature: `column.getIsLastColumn()`, used by the same pinning style calculation to draw
//   the divider after the last pinned column. Nothing in this app actually reorders columns.
// - columnVisibilityFeature: the View menu's show/hide toggles.
//
// Deliberately NOT registered: columnFilteringFeature and globalFilteringFeature. Per-column filtering in
// this app is entirely custom (the `Filters<T>` prop plus `ColumnMeta.filterKey`/`filterVariant`), never
// TanStack's own column-filter state or row model - `manualFiltering` and the per-column `enableColumnFilter`
// were already dead configuration under v8 for that reason (nothing ever wired up `getFilteredRowModel()`).
// Whether the per-column filter inputs are shown was, for the same reason, never real global filtering
// either - it's a plain boolean UI toggle, and lives as component state in `table.tsx` rather than routed
// through a table feature. `columnFilteringFeature` was briefly registered as a type-level-only prerequisite
// of `globalFilteringFeature`, purely to keep that boolean on `state.globalFilter` - not worth pulling in two
// feature registrations for a value with no relationship to either feature's actual purpose.
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowExpandingFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnOrderingFeature,
  columnVisibilityFeature,
  expandedRowModel: createExpandedRowModel(),
});

export type AppFeatures = typeof dataTableFeatures;

// Every column-def file in the app should import this instead of `ColumnDef` directly, so v9's `TFeatures`
// generic stays pinned in one place rather than repeated at every call site.
export type AppColumnDef<TData extends BaseTableRow> = ColumnDef<AppFeatures, TData>;
