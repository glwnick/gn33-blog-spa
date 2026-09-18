import type { SelectOptionContentItem } from '@/query-options/collection-options';
import type { CellData, RowData, TableFeatures } from '@tanstack/react-table';

declare module '@tanstack/react-table' {
  interface ColumnMeta<
    TFeatures extends TableFeatures,
    TData extends RowData,
    TValue extends CellData = CellData,
  > {
    // `keyof TData` for the common case, widened to any string for a filter with no matching response field of
    // its own shape (e.g. a `category` slug filtering a `categories: Array<CategoryRef>` column) - the `& {}`
    // keeps `keyof TData`'s autocomplete instead of collapsing the union down to plain `string`.
    filterKey?: keyof TData | (string & {});
    filterVariant?: 'text' | 'number' | 'date' | 'select';
    filterOptions?: Array<SelectOptionContentItem>;
    // A `select` filter's options are always strings, but the filter key's real type isn't always a string
    // (e.g. `enabled: boolean`) - set both to convert, or the raw string round-trips into the filter object
    // and fails the URL search schema's `.boolean()` parse on the next navigation. Omit both when the
    // filter key is already string-typed (e.g. an enum filter like `role`).
    filterParse?: (raw: string) => unknown;
    filterFormat?: (value: unknown) => string | null;
    // The View menu's column-toggle label. Falls back to `t(column.id)` when absent, which only matches a
    // column's real header when the id happens to equal its translation key - set this whenever a column's
    // header is titled from a different key (e.g. `orderCount` headed "Orders").
    label?: string;
  }
}
