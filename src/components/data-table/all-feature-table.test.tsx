import '@/lib/i18n';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { AllFeatureTable } from './all-feature-table';
import type { AppColumnDef } from './table-features';
import type { Filters, Page } from '@/types/pageable';

// `Pagination` (rendered by `DataTable`, rendered by `AllFeatureTable`) calls `useIsMobile()`, which reads
// `window.matchMedia` - jsdom doesn't implement it. Same shim as `table.test.tsx`.
window.matchMedia = () =>
  ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as unknown as MediaQueryList;

type Row = { id: string; name: string };

const columns: Array<AppColumnDef<Row>> = [{ accessorKey: 'name', header: 'Name' }];

function pageOf(totalPages: number): Page<Row> {
  return {
    content: [{ id: '1', name: 'A row' }],
    number: 0,
    size: 10,
    totalElements: totalPages * 10,
    totalPages,
  };
}

type HarnessState = { filtersPage: number; totalPages: number };

function Harness({
  setFilters,
  initial,
  next,
}: {
  readonly setFilters: (filters: Filters<Row>) => void;
  readonly initial: HarnessState;
  readonly next: HarnessState;
}) {
  const [state, setState] = useState(initial);
  return (
    <>
      <AllFeatureTable
        page={pageOf(state.totalPages)}
        columns={columns}
        getRowId={(row) => row.id}
        filter={{
          filters: { page: state.filtersPage },
          setFilters,
          resetFilters: async () => {},
        }}
      />
      <button onClick={() => setState(next)}>advance</button>
    </>
  );
}

// Regression coverage for the pagination bug: the reset effect used to compare `page.totalElements` against
// the hardcoded `DEFAULT_PAGE_SIZE`, so it only ever caught "the whole result set now fits on one page of the
// *default* size" - e.g. picking a larger page size while sitting on page 2+ left the table stuck showing an
// empty page, since the total element count alone was never below the constant even though the current page
// index no longer existed at the newly-requested size.
describe('AllFeatureTable out-of-range pagination reset', () => {
  afterEach(cleanup);

  it('does not reset on mount when the current page index is already within range', () => {
    const setFilters = vi.fn();
    render(
      <Harness
        setFilters={setFilters}
        initial={{ filtersPage: 1, totalPages: 3 }}
        next={{ filtersPage: 1, totalPages: 3 }}
      />,
    );

    expect(setFilters).not.toHaveBeenCalled();
  });

  it('does not reset on an update that moves between two still-valid pages', () => {
    const setFilters = vi.fn();
    render(
      <Harness
        setFilters={setFilters}
        initial={{ filtersPage: 0, totalPages: 3 }}
        // Advancing from page 0 to page 1 of 3 is a normal "next page" click, not an out-of-range recovery -
        // the effect must not treat every update as a reset trigger, only ones that land out of range.
        next={{ filtersPage: 1, totalPages: 3 }}
      />,
    );

    fireEvent.click(screen.getByText('advance'));

    expect(setFilters).not.toHaveBeenCalled();
  });

  it('snaps back to the first page once the current index falls out of range', () => {
    const setFilters = vi.fn();
    render(
      <Harness
        setFilters={setFilters}
        initial={{ filtersPage: 1, totalPages: 3 }}
        // Mirrors picking a larger page size while on page index 1 (3 pages of 10): the same 20-30 total rows
        // now fit in fewer, larger pages, so index 1 no longer exists.
        next={{ filtersPage: 1, totalPages: 1 }}
      />,
    );

    fireEvent.click(screen.getByText('advance'));

    expect(setFilters).toHaveBeenCalledWith(expect.objectContaining({ page: 0 }));
  });

  it('does not call setFilters on an empty result set already sitting on the first page', () => {
    const setFilters = vi.fn();
    render(
      <Harness
        setFilters={setFilters}
        initial={{ filtersPage: 0, totalPages: 3 }}
        next={{ filtersPage: 0, totalPages: 0 }}
      />,
    );

    fireEvent.click(screen.getByText('advance'));

    expect(setFilters).not.toHaveBeenCalled();
  });
});
