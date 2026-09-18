import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MinusCircle,
} from 'lucide-react';
import type {
  OnChangeFn,
  ReactTable,
  RowData,
  RowSelectionState,
} from '@tanstack/react-table';
import type { AppFeatures } from '@/components/data-table/table-features';
import { COLUMN_SELECT_CHECKBOX } from '@/components/data-table/constants';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PAGE_SIZES } from '@/config/table';
import { useTranslation } from '@/hooks/use-translation';
import { useIsMobile } from '@/hooks/use-mobile';

interface PaginationProps<TData extends RowData> {
  // `ReactTable`, not the framework-agnostic core `Table`: `.state` (the reactive full-state read this file
  // uses) is a React-specific convenience `useTable()` adds on top of core's `.store`, not part of `Table`.
  table: ReactTable<AppFeatures, TData>;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
}

export function Pagination<TData extends RowData>({
  table,
  rowSelection,
  onRowSelectionChange,
}: Readonly<PaginationProps<TData>>) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const selectedRows = Object.keys(rowSelection || {});
  const hasSelectColumn = table
    .getAllColumns()
    .some((column) => column.id === COLUMN_SELECT_CHECKBOX);

  return (
    <div className="flex items-center justify-between px-2 pt-2">
      {hasSelectColumn ? (
        <div className="text-muted-foreground flex items-center gap-1 text-sm">
          {isMobile ? (
            <p>
              {t('xOfY', {
                x: selectedRows.length,
                y: table.getRowCount(),
              })}
            </p>
          ) : (
            <p>
              {t('selectedRowsInfo', {
                selectedCount: selectedRows.length,
                totalCount: table.getRowCount(),
              })}
            </p>
          )}
          <Button
            variant="ghost"
            onClick={() => onRowSelectionChange?.({})}
            size="sm"
            disabled={!selectedRows.length}
          >
            <MinusCircle />
          </Button>
        </div>
      ) : (
        <div className="text-muted-foreground">
          {isMobile ? (
            <p>{table.getRowCount()}</p>
          ) : (
            <p>{t('totalRowsInfo', { totalCount: table.getRowCount() })}</p>
          )}
        </div>
      )}

      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          {!isMobile && (
            <p className="text-sm font-medium">{t('rowsPerPage')}</p>
          )}
          <Select
            items={PAGE_SIZES.map((pageSize) => ({
              value: `${pageSize}`,
              label: `${pageSize}`,
            }))}
            value={`${table.state.pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 ">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {PAGE_SIZES.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-center text-sm font-medium">
          {isMobile ? (
            <p>
              {t('xOfY', {
                x: table.state.pagination.pageIndex + 1,
                y: table.getPageCount(),
              })}
            </p>
          ) : (
            <p>
              {t('pageOf', {
                currentPage: table.state.pagination.pageIndex + 1,
                totalPages: table.getPageCount(),
              })}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
