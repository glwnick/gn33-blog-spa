import type { CsvImportKind, CsvImportResult } from '@/schemas/csv-import';
import { csvImportResultSchema } from '@/schemas/csv-import';
import API_ENDPOINTS from '@/config/api-endpoints';
import api from '@/lib/axios';

/**
 * Uploads a CSV file for import. With {@code dryRun} true (the default preview) nothing is written
 * and the response reports what would happen per row; with {@code dryRun} false the valid rows are
 * created and the rest are skipped and reported.
 */
export const importCsv = async (
  kind: CsvImportKind,
  file: File,
  dryRun: boolean,
): Promise<CsvImportResult> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<CsvImportResult>(API_ENDPOINTS.adminCsvImport[kind], formData, {
    params: { dryRun },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return csvImportResultSchema.parse(res.data);
};
