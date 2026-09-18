import { flexRender, useTable } from '@tanstack/react-table';
import { SearchIcon } from 'lucide-react';
import { Fragment, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type {
  Column,
  ColumnVisibilityState,
  ExpandedState,
  OnChangeFn,
  PaginationState,
  Row,
  RowSelectionState,
  SortingState,
  TableOptions_RowPagination,
} from '@tanstack/react-table';
import type { BaseTableRow, Filters } from '@/types/pageable';
import type { AppColumnDef, AppFeatures } from '@/components/data-table/table-features';
import { ColumnFilterDate } from '@/components/data-table/column-filter-date';
import { ColumnFilterSelect } from '@/components/data-table/column-filter-select';
import { Kbd } from '@/components/ui/kbd';
import { DataTableOptions } from '@/components/data-table/view-options';
import { DebouncedInput } from '@/components/debounce-input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { Pagination } from '@/components/data-table/pagination';
import { AUDIT_COLUMN_VISIBILITY } from '@/components/data-table/constants';
import { dataTableFeatures } from '@/components/data-table/table-features';

type ColumnFilterProps<T extends BaseTableRow> = {
  fieldMeta: NonNullable<AppColumnDef<T>['meta']>;
  filters: Filters<T>;
  onFilterChange: (dataFilters: Partial<Filters<T>>) => void;
  t: ReturnType<typeof useTranslation>['t'];
};

function renderColumnFilter<T extends BaseTableRow>({
  fieldMeta,
  filters,
  onFilterChange,
  t,
}: ColumnFilterProps<T>): ReactNode {
  const filterKey = fieldMeta.filterKey as keyof T;

  const onChange = (value: T[keyof T]) =>
    onFilterChange({ [filterKey]: value } as Partial<Filters<T>>);

  switch (fieldMeta.filterVariant) {
    case 'select':
      return fieldMeta.filterOptions ? (
        <ColumnFilterSelect
          filterOptions={fieldMeta.filterOptions}
          filterValue={
            fieldMeta.filterFormat
              ? fieldMeta.filterFormat(filters[filterKey])
              : (filters[filterKey] as string | null)
          }
          onSelectChange={(val) =>
            onChange(
              (fieldMeta.filterParse ? fieldMeta.filterParse(val ?? '') : val) as T[keyof T],
            )
          }
        />
      ) : null;
    case 'date':
      return (
        <ColumnFilterDate
          filterValue={filters[filterKey] as string}
          onDateChange={(val) => onChange(val as T[keyof T])}
        />
      );
    default:
      return (
        <DebouncedInput
          onChange={(val) => onChange(val as T[keyof T])}
          placeholder={`${t('search')}...`}
          type={fieldMeta.filterVariant === 'number' ? 'number' : 'text'}
          value={(filters[filterKey] as string | number | undefined) ?? ''}
          className="-ml-1"
          startNode={<SearchIcon className="text-muted-foreground" />}
          endNode={<Kbd>⏎</Kbd>}
        />
      );
  }
}

type PinningStyles = {
  className: string;
  style: CSSProperties;
};

function getCommonPinningStyles<T extends BaseTableRow>(
  column: Column<AppFeatures, T>,
  isHeader = false,
): PinningStyles {
  const isPinned = column.getIsPinned();
  const isLastStartPinnedColumn =
    isPinned === 'start' && column.getIsLastColumn('start');
  return {
    className: cn(
      isPinned ? 'sticky bg-card' : 'relative',
      isPinned && (isHeader ? 'z-50' : 'z-40'),
      isLastStartPinnedColumn && 'border-r-2',
    ),
    style: {
      left: isPinned === 'start' ? `${column.getStart('start')}px` : undefined,
      ...(isPinned
        ? { minWidth: column.getSize(), width: column.getSize() }
        : {}),
    },
  };
}

type DataTableProps<T extends BaseTableRow> = {
  data: Array<T>;
  columns: Array<AppColumnDef<T>>;
  pagination: PaginationState;
  paginationOptions: Pick<TableOptions_RowPagination, 'onPaginationChange' | 'rowCount'>;
  filters: Filters<T>;
  onFilterChange: (dataFilters: Partial<Filters<T>>) => void;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  actions?: React.ReactNode;
  resetFilters: () => Promise<void>;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  getRowId?: (originalRow: T, index: number, parent?: Row<AppFeatures, T>) => string;
  getRowCanExpand?: (row: Row<AppFeatures, T>) => boolean;
  renderSubComponent?: (row: Row<AppFeatures, T>) => ReactNode;
  initialColumnVisibility?: ColumnVisibilityState;
};

export function DataTable<T extends BaseTableRow>({
  data,
  columns,
  pagination,
  paginationOptions,
  filters,
  onFilterChange,
  sorting,
  onSortingChange,
  actions = <div />,
  resetFilters,
  rowSelection = {},
  onRowSelectionChange,
  getRowId,
  getRowCanExpand,
  renderSubComponent,
  initialColumnVisibility,
}: Readonly<DataTableProps<T>>) {
  const { t } = useTranslation();

  const [expanded, setExpanded] = useState<ExpandedState>({});
  // Whether the per-column filter inputs are shown - a denser view is the default, and the toggle (or the S
  // shortcut, in `DataTableOptions`) reveals them. Plain component state, not a registered table feature:
  // this app never does real global-text or column filtering through TanStack's own state or row models (see
  // `table-features.ts`), so there is nothing gained by routing a UI-only boolean through the table instance.
  const [showFilters, setShowFilters] = useState(false);

  const table = useTable({
    features: dataTableFeatures,
    getRowId,
    data,
    columns,
    state: { pagination, sorting, rowSelection, expanded },
    onSortingChange,
    onRowSelectionChange,
    ...paginationOptions,
    enableRowSelection: true,
    // Holds v8's behavior exactly during the v9 migration - v9 defaults this to `true`, which is a real new
    // capability (shift-click range select), not something this migration should slip in as a side effect.
    enableRowRangeSelection: false,
    manualSorting: true,
    manualPagination: true,
    onExpandedChange: setExpanded,
    getRowCanExpand,
    initialState: {
      columnVisibility: {
        ...AUDIT_COLUMN_VISIBILITY,
        ...initialColumnVisibility,
      },
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mx-1 mb-2">
        {actions}
        <div className="flex items-center gap-2 ms-auto">
          <DataTableOptions
            table={table}
            filterData={filters}
            resetFilters={resetFilters}
            showFilters={showFilters}
            onShowFiltersChange={setShowFilters}
          />
        </div>
      </div>
      {/*
       * The vertical clamp lives on the table's own scroll container, not on a
       * wrapper around it: that container is already a scroll container on both
       * axes (its `overflow-x-auto` forces `overflow-y` to compute to `auto`),
       * so a second scroller outside it would leave the sticky header anchored
       * to the inner one while the outer did the scrolling - i.e. not sticky.
       */}
      <Table containerClassName="max-h-[calc(100dvh-14rem)] rounded-md border bg-card">
        <TableHeader className="sticky top-0 z-20 bg-card">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const fieldMeta = header.column.columnDef.meta;
                const { className: pinningClassName, style: pinningStyle } =
                  getCommonPinningStyles(header.column, true);
                return (
                  <TableHead
                    key={header.id}
                    className={pinningClassName}
                    style={{ ...pinningStyle }}
                  >
                    <div className="flex flex-col gap-1 m-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}

                      {showFilters &&
                      fieldMeta?.filterKey !== undefined
                        ? renderColumnFilter({
                            fieldMeta,
                            filters,
                            onFilterChange,
                            t,
                          })
                        : null}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <TableRow
                  className="group/row"
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => {
                    const { className: pinningClassName, style: pinningStyle } =
                      getCommonPinningStyles(cell.column);
                    return (
                      <TableCell
                        key={cell.id}
                        className={pinningClassName}
                        style={pinningStyle}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
                {row.getIsExpanded() && renderSubComponent && (
                  <tr
                    data-slot="table-row"
                    className="border-b transition-colors"
                  >
                    <TableCell colSpan={columns.length} className="pl-4 ">
                      {renderSubComponent(row)}
                    </TableCell>
                  </tr>
                )}
              </Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-16 text-center">
                {t('noResults')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination
        table={table}
        rowSelection={rowSelection}
        onRowSelectionChange={onRowSelectionChange}
      />
    </div>
  );
}
