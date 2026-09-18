import '@/lib/i18n';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useState } from 'react';
import { DataTable } from './table';
import type { RowSelectionState } from '@tanstack/react-table';
import type { AppColumnDef } from './table-features';
import { Checkbox } from '@/components/ui/checkbox';

// `Pagination` (rendered by `DataTable`) calls `useIsMobile()`, which reads `window.matchMedia` - jsdom
// doesn't implement it, and this is the first test in the suite to render anything that does.
window.matchMedia = () =>
  ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as unknown as MediaQueryList;

type Person = { id: string; name: string };

const people: Array<Person> = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
];

// Mirrors the exact shape of `pages/users/columns.tsx`'s select-checkbox column, including the
// `onCheckedChange` fix for the v9 regression this test guards against: `row.getToggleSelectedHandler()`
// expects a real DOM event (`event.target.checked`), but base-ui's `Checkbox.onCheckedChange` calls back
// with a plain boolean plus its own event-details wrapper - calling the real handler with the wrong shape
// is exactly what threw `Cannot read properties of undefined (reading 'checked')` in production.
const columns: Array<AppColumnDef<Person>> = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        checked={table.getIsAllRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={`Select ${row.original.name}`}
        checked={row.getIsSelected()}
        onCheckedChange={(checked, eventDetails) =>
          row.getToggleSelectedHandler()({
            target: { checked },
            shiftKey: 'shiftKey' in eventDetails.event ? eventDetails.event.shiftKey : false,
          })
        }
      />
    ),
  },
  { accessorKey: 'name', header: 'Name' },
];

function Harness() {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  return (
    <DataTable
      data={people}
      columns={columns}
      pagination={{ pageIndex: 0, pageSize: 10 }}
      paginationOptions={{ onPaginationChange: () => {}, rowCount: people.length }}
      filters={{}}
      onFilterChange={() => {}}
      sorting={[]}
      onSortingChange={() => {}}
      resetFilters={async () => {}}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
      getRowId={(person) => person.id}
    />
  );
}

describe('DataTable row selection checkbox', () => {
  afterEach(cleanup);

  it('selects a row without throwing when clicked', () => {
    render(<Harness />);
    const aliceCheckbox = screen.getByLabelText('Select Alice');

    expect(() => fireEvent.click(aliceCheckbox)).not.toThrow();

    expect(aliceCheckbox.getAttribute('aria-checked')).toBe('true');
    expect(screen.getByLabelText('Select Bob').getAttribute('aria-checked')).toBe('false');
  });

  it('deselects an already-selected row', () => {
    render(<Harness />);
    const aliceCheckbox = screen.getByLabelText('Select Alice');

    fireEvent.click(aliceCheckbox);
    expect(aliceCheckbox.getAttribute('aria-checked')).toBe('true');

    fireEvent.click(aliceCheckbox);
    expect(aliceCheckbox.getAttribute('aria-checked')).toBe('false');
  });
});
