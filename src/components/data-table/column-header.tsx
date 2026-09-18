import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import type { Column, RowData } from '@tanstack/react-table';
import type { AppFeatures } from '@/components/data-table/table-features';
import { Button } from '@/components/ui/button';

export function ColumnHeader<TData extends RowData, TValue>({
  column,
  title,
}: Readonly<{
  column: Column<AppFeatures, TData, TValue>;
  title: string | ReactNode;
}>): ReactElement {
  return (
    <div className="flex items-center justify-between">
      {typeof title === 'string' ? (
        <span className="py-1">{title}</span>
      ) : (
        title
      )}
      {column.getCanSort() && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {{
            asc: <ArrowUp />,
            desc: <ArrowDown />,
            false: <ChevronsUpDown />,
          }[column.getIsSorted() as string] ?? null}
        </Button>
      )}
    </div>
  );
}
