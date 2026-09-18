/**
 * Builds a CSV from rows of cells and hands it to the browser as a download.
 *
 * <p>Shared by the import screen's template download and its error report. A cell carrying a comma, quote or
 * newline is quoted rather than written raw: the error report exists to be edited and re-uploaded, so a file
 * that does not survive its own round trip through the importer would defeat the point of producing it.
 */
export const downloadCsv = (
  fileName: string,
  rows: ReadonlyArray<ReadonlyArray<string>>,
): void => {
  const escape = (cell: string) =>
    /[",\n\r]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
  const csv = rows.map((row) => row.map(escape).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};
