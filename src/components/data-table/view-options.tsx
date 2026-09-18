import {
  CheckCheck,
  Pin,
  RefreshCwIcon,
  Search,
  SearchX,
  Settings2,
} from 'lucide-react';
import { useEffect } from 'react';
import type { Column, ReactTable } from '@tanstack/react-table';
import type { AppFeatures } from '@/components/data-table/table-features';
import type { BaseTableRow, Filters } from '@/types/pageable';
import { ButtonGroup } from '@/components/ui/button-group';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { AUDIT_COLUMN_KEYS } from '@/components/data-table/constants';


export function DataTableOptions<TData extends BaseTableRow>({
  table,
  filterData,
  resetFilters,
  showFilters,
  onShowFiltersChange,
}: Readonly<{
  // `ReactTable`, not the framework-agnostic core `Table` - see `pagination.tsx` for why `.state` needs it.
  table: ReactTable<AppFeatures, TData>;
  filterData: Filters<TData>;
  resetFilters: () => Promise<void>;
  showFilters: boolean;
  onShowFiltersChange: (value: boolean) => void;
}>) {
  const isFiltered = Object.keys(filterData).some(
    (key) => filterData[key as keyof Filters<TData>] !== undefined,
  );
  const { t } = useTranslation();

  useEffect(() => {
    const handleKeyDownSearch = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      if (e.key.toLowerCase() === 's') {
        onShowFiltersChange(!showFilters);
      }
    };

    window.addEventListener('keydown', handleKeyDownSearch);

    return () => {
      window.removeEventListener('keydown', handleKeyDownSearch);
    };
  }, [showFilters, onShowFiltersChange]);

  return (
    <ButtonGroup>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" className="ml-auto h-8 lg:flex">
              <Settings2 />
              <span className="hidden lg:block">{t('view')}</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-[150px]">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t('pinAndToggleColumns')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter(
                (column) =>
                  column.accessorFn !== undefined &&
                  column.getCanHide() &&
                  !AUDIT_COLUMN_KEYS.includes(column.id),
              )
              .map((column) => (
                <ColumnVisibilityItem key={column.id} column={column} />
              ))}
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <Button
                size="xs"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  table
                    .getAllColumns()
                    .filter((column) => AUDIT_COLUMN_KEYS.includes(column.id))
                    .forEach((column) => {
                      column.toggleVisibility(!column.getIsVisible());
                      column.pin(false);
                    });
                }}
              >
                {t('auditColumns')}
                <CheckCheck />
              </Button>
            </DropdownMenuLabel>
            {table
              .getAllColumns()
              .filter(
                (column) =>
                  column.accessorFn !== undefined &&
                  column.getCanHide() &&
                  AUDIT_COLUMN_KEYS.includes(column.id),
              )
              .map((column) => (
                <ColumnVisibilityItem key={column.id} column={column} />
              ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {isFiltered && (
        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-8 lg:flex"
          onClick={resetFilters}
        >
          <RefreshCwIcon />
          <span className="hidden lg:block">{t('resetFilters')}</span>
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        className="ml-auto h-8 lg:flex"
        onClick={() => onShowFiltersChange(!showFilters)}
      >
        {showFilters ? <SearchX /> : <Search />}
        <span className="hidden lg:block">{t('search')}</span>
      </Button>
    </ButtonGroup>
  );
}

// Props
type ColumnVisibilityItemProps<TData extends BaseTableRow> = {
  column: Column<AppFeatures, TData>;
};

function ColumnVisibilityItem<TData extends BaseTableRow>({
  column,
}: ColumnVisibilityItemProps<TData>) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center">
      <Button
        disabled={!column.getIsVisible()}
        variant={column.getIsPinned() === 'start' ? 'default' : 'ghost'}
        size="icon-xs"
        onClick={() =>
          column.getIsPinned() === 'start'
            ? column.pin(false)
            : column.pin('start')
        }
      >
        <Pin className={column.getIsPinned() === 'start' ? 'rotate-90' : ''} />
      </Button>
      <Separator orientation="vertical" className="h-4 self-center!" />
      <DropdownMenuCheckboxItem
        className="w-full"
        checked={column.getIsVisible()}
        onCheckedChange={(value) => {
          column.toggleVisibility(!!value);
          if (!value) column.pin(false);
        }}
      >
        {column.columnDef.meta?.label ?? t(column.id as any)}
      </DropdownMenuCheckboxItem>
    </div>
  );
}
