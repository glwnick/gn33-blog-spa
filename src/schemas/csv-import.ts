import { z } from 'zod';

/**
 * Per-row outcome of a CSV import; mirrors the backend {@code CsvRowStatus} enum. {@code UPDATED} (slice 7) is
 * distinct from {@code CREATED}: the stock-levels importer mutates an existing row rather than making a new one.
 */
export const csvRowStatusSchema = z.enum([
  'VALID',
  'CREATED',
  'UPDATED',
  'SKIPPED_DUPLICATE',
  'SKIPPED_CONFLICT',
  'ERROR',
]);

export type CsvRowStatus = z.infer<typeof csvRowStatusSchema>;

export const csvImportRowResultSchema = z.object({
  line: z.number().int(),
  status: csvRowStatusSchema,
  summary: z.string(),
  message: z.string().nullable(),
  /**
   * The row's raw cell values in file order, from the parser that already read the file server-side, so the
   * preview can show the admin's actual spreadsheet columns without the SPA re-parsing the CSV itself. Empty
   * for a row the parser could not split into the expected number of columns.
   */
  cells: z.array(z.string()),
});

export type CsvImportRowResult = z.infer<typeof csvImportRowResultSchema>;

export const csvImportResultSchema = z.object({
  dryRun: z.boolean(),
  totalRows: z.number().int(),
  importableRows: z.number().int(),
  skippedRows: z.number().int(),
  rows: z.array(csvImportRowResultSchema),
});

export type CsvImportResult = z.infer<typeof csvImportResultSchema>;

// `stockLevels` joined `users` in slice 7. `products` (full product creation) is deliberately not here - see the
// slice 7 plan's conflict-resolution section for why a CSV can't safely carry a product's mandatory compliance
// fields and images.
export type CsvImportKind = 'users' | 'stockLevels';
