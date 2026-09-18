import { createFileRoute } from '@tanstack/react-router';
import { CsvImportPage } from '@/pages/csv-import/csv-import-page';

export const Route = createFileRoute('/_auth/_admin/import/')({
  component: CsvImportPage,
});
