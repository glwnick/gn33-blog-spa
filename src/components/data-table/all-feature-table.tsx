import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { ColumnVisibilityState, Row, RowSelectionState } from '@tanstack/react-table';

import type { BaseTableRow, Filters, Page } from '@/types/pageable';
import type { AppColumnDef, AppFeatures } from '@/components/data-table/table-features';
import { DataTable } from '@/components/data-table/table';
import { sortByToState, stateToSortBy } from '@/lib/table-sort-mapper';
import { DEFAULT_PAGE_INDEX, DEFAULT_PAGE_SIZE } from '@/config/table';

type Props<TData extends BaseTableRow> = {
  page: Page<TData>;
  columns: Array<AppColumnDef<TData>>;
  actions?: React.ReactNode;
  getRowId: (originalRow: TData, index: number, parent?: Row<AppFeatures, TData>) => string;
  filter: {
    filters: Filters<TData>;
    setFilters: (filters: Filters<TData>) => void;
    resetFilters: () => Promise<void>;
  };
  getRowCanExpand?: (row: Row<AppFeatures, TData>) => boolean;
  renderSubComponent?: (row: Row<AppFeatures, TData>) => ReactNode;
  // Overrides `AUDIT_COLUMN_VISIBILITY`'s hide-by-default for a specific column id, for a table that wants
  // one of the audit fields shown up front (e.g. the Users table's "Joined" column, which is `createdDate`).
  initialColumnVisibility?: ColumnVisibilityState;
};

export function AllFeatureTable<TData extends BaseTableRow>({
  page,
  columns,
  actions,
  getRowId,
  filter,
  getRowCanExpand,
  renderSubComponent,
  initialColumnVisibility,
}: Readonly<Props<TData>>) {
  const { filters, setFilters, resetFilters } = filter;
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const paginationState = {
    pageIndex: filters.page ?? DEFAULT_PAGE_INDEX,
    pageSize: filters.size ?? DEFAULT_PAGE_SIZE,
  };

  const sortingState = sortByToState(filters.sort);

  // Snaps back to the first page when the current page index has fallen out of range - e.g. a filter or
  // search narrowed the result set, or the page-size picker was changed while sitting on a later page. This
  // used to compare `page.totalElements` against the hardcoded `DEFAULT_PAGE_SIZE`, which only happened to
  // catch "the whole result set now fits on one page of the *default* size" and missed every other
  // out-of-range case - most visibly, picking a larger page size while on page 2+ left the table showing an
  // empty page with no way back short of editing the URL, since the total element count alone (25, say) was
  // never below 10 even though the current page index no longer existed at the new size.
  useEffect(() => {
    const pageIndex = filters.page ?? DEFAULT_PAGE_INDEX;
    if (pageIndex > DEFAULT_PAGE_INDEX && pageIndex >= page.totalPages) {
      setFilters({
        ...filters,
        page: DEFAULT_PAGE_INDEX,
      });
    }
  }, [page]);

  return (
    <DataTable
      data={page.content}
      columns={columns}
      pagination={paginationState}
      paginationOptions={{
        onPaginationChange: (pagination) => {
          const newPagination =
            typeof pagination === 'function'
              ? pagination(paginationState)
              : pagination;
          setFilters({
            ...filters,
            page: newPagination.pageIndex,
            size: newPagination.pageSize,
          });
        },
        rowCount: page.totalElements,
      }}
      filters={filters}
      onFilterChange={(f) => setFilters(f)}
      sorting={sortingState}
      onSortingChange={(updaterOrValue) => {
        const newSortingState =
          typeof updaterOrValue === 'function'
            ? updaterOrValue(sortingState)
            : updaterOrValue;
        return setFilters({ ...filters, sort: stateToSortBy(newSortingState) });
      }}
      resetFilters={resetFilters}
      actions={actions}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
      getRowId={getRowId}
      getRowCanExpand={getRowCanExpand}
      renderSubComponent={renderSubComponent}
      initialColumnVisibility={initialColumnVisibility}
    />
  );
}
