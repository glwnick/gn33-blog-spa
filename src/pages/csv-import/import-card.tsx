import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, Upload } from 'lucide-react';
import type { FC } from 'react';
import type {
  CsvImportKind,
  CsvImportResult,
  CsvRowStatus,
} from '@/schemas/csv-import';
import type { TranslationKey } from '@/hooks/use-translation';
import { importCsv } from '@/api/csv-import-api';
import { useTranslation } from '@/hooks/use-translation';
import { downloadCsv } from '@/lib/csv-download';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { USER_KEY } from '@/query-options/user-options';

export type ImportCardConfig = {
  readonly kind: CsvImportKind;
  readonly titleKey: TranslationKey;
  readonly descriptionKey: TranslationKey;
  readonly columns: ReadonlyArray<string>;
  readonly sample: ReadonlyArray<string>;
  /** Which query cache a successful commit invalidates. Defaults to the users list. */
  readonly invalidateKey?: string;
};

/** One finished run, for the page's recent-imports rail. */
export type RecentImport = {
  readonly id: string;
  readonly kind: CsvImportKind;
  readonly fileName: string;
  readonly imported: number;
  readonly skipped: number;
  readonly at: Date;
};

const STATUS_LABEL_KEY: Record<CsvRowStatus, TranslationKey> = {
  VALID: 'csvStatusValid',
  CREATED: 'csvStatusCreated',
  UPDATED: 'csvStatusUpdated',
  SKIPPED_DUPLICATE: 'csvStatusDuplicate',
  SKIPPED_CONFLICT: 'csvStatusConflict',
  ERROR: 'csvStatusError',
};

/** Only `ERROR` is destructive. A skipped duplicate is a normal outcome of re-importing yesterday's file. */
const isRowError = (status: CsvRowStatus) => status === 'ERROR';

const statusClassName = (status: CsvRowStatus): string => {
  if (status === 'VALID' || status === 'CREATED' || status === 'UPDATED') {
    return 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300';
  }
  if (status === 'ERROR') {
    return 'bg-destructive/10 text-destructive';
  }
  return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
};

const formatFileSize = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : `${Math.round(bytes / 1024)} KB`;

export const ImportCard: FC<{
  config: ImportCardConfig;
  onImported?: (entry: RecentImport) => void;
}> = ({ config, onImported }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [parseMs, setParseMs] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // The dropzone is a styled div, so the real input stays off-screen and is opened through this ref rather
  // than by nesting a control inside a label - a nested button would swallow the drop target's own clicks.
  const inputRef = useRef<HTMLInputElement>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [config.invalidateKey ?? USER_KEY] });
  };

  const dryRunMutation = useMutation({
    mutationFn: async (selected: File) => {
      const startedAt = performance.now();
      const data = await importCsv(config.kind, selected, true);
      setParseMs(Math.round(performance.now() - startedAt));
      return data;
    },
    onSuccess: setResult,
    onError: (err: Error) => {
      setResult(null);
      setParseMs(null);
      toast.error(err.message);
    },
  });

  const commitMutation = useMutation({
    mutationFn: (selected: File) => importCsv(config.kind, selected, false),
    onSuccess: (data) => {
      setResult(data);
      invalidate();
      toast.success(t('csvImportCommitted', { count: data.importableRows }));
      onImported?.({
        id: `${Date.now()}`,
        kind: config.kind,
        fileName: file?.name ?? '',
        imported: data.importableRows,
        skipped: data.skippedRows,
        at: new Date(),
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleFileChange = (selected: File | null) => {
    setFile(selected);
    setResult(null);
    setParseMs(null);
    if (selected) {
      dryRunMutation.mutate(selected);
    }
  };

  const downloadErrorReport = () =>
    downloadCsv(`${config.kind}-errors.csv`, [
      ['line', ...config.columns, 'error'],
      ...(result?.rows ?? [])
        .filter((row) => isRowError(row.status))
        .map((row) => [
          String(row.line),
          ...config.columns.map((_, index) => row.cells[index] ?? ''),
          row.message ?? '',
        ]),
    ]);

  const errorCount = result?.rows.filter((row) => isRowError(row.status)).length ?? 0;
  const skippedNonError = result ? result.skippedRows - errorCount : 0;
  const isBusy = dryRunMutation.isPending || commitMutation.isPending;
  const canCommit = !!result && result.dryRun && result.importableRows > 0 && !isBusy;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t(config.titleKey)}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            disabled={isBusy}
            onChange={(e) => {
              const selected = e.target.files?.[0] ?? null;
              // Reset the input so re-selecting the same file (e.g. after fixing it) fires onChange again.
              e.target.value = '';
              handleFileChange(selected);
            }}
          />
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              // `.at(0)` over `files[0]`: `noUncheckedIndexedAccess` is off, so the index form types an
              // empty drop as a `File` that is actually undefined at runtime.
              const dropped = Array.from(e.dataTransfer.files).at(0);
              if (dropped && !isBusy) {
                handleFileChange(dropped);
              }
            }}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-[18px] border-[1.5px] border-dashed bg-muted/40 p-8 text-center transition-colors',
              isDragging ? 'border-primary bg-accent' : 'border-border',
            )}
          >
            <Upload className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">{t('csvDropzoneTitle')}</p>
            <p className="text-xs text-muted-foreground">{t(config.descriptionKey)}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              disabled={isBusy}
              onClick={() => inputRef.current?.click()}
            >
              {t('csvChooseFile')}
            </Button>
          </div>

          {file && result && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-accent p-3 text-accent-foreground">
              <span className="font-mono text-xs font-medium">{file.name}</span>
              <span className="text-xs">
                {t('csvParsedSummary', {
                  rows: result.totalRows,
                  size: formatFileSize(file.size),
                  ms: parseMs ?? 0,
                })}
              </span>
              <Badge variant="accent" className="ml-auto border border-current/20">
                {t('csvReady')}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card className="gap-0 p-0">
          <CardHeader className="flex-row items-center gap-2 py-4">
            <CardTitle>{t('csvPreviewTitle')}</CardTitle>
            <div className="ml-auto flex gap-2">
              <Badge variant="accent">
                {t('csvValidCount', { count: result.importableRows })}
              </Badge>
              {errorCount + skippedNonError > 0 && (
                <Badge variant="destructive">
                  {t('csvNeedAttentionCount', { count: errorCount + skippedNonError })}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-auto border-y">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-mono text-[11px] tracking-tight uppercase">
                      {t('csvColumnLine')}
                    </TableHead>
                    {config.columns.map((column) => (
                      <TableHead
                        key={column}
                        className="font-mono text-[11px] tracking-tight"
                      >
                        {column}
                      </TableHead>
                    ))}
                    <TableHead className="font-mono text-[11px] tracking-tight uppercase">
                      {t('csvColumnStatus')}
                    </TableHead>
                    <TableHead className="font-mono text-[11px] tracking-tight uppercase">
                      {t('csvColumnMessage')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.map((row) => {
                    const failed = isRowError(row.status);
                    return (
                      <TableRow
                        key={row.line}
                        className={cn(failed && 'bg-destructive/6 hover:bg-destructive/10')}
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {row.line}
                        </TableCell>
                        {config.columns.map((column, index) => (
                          <TableCell
                            key={column}
                            className={cn('text-xs', failed && 'text-destructive')}
                          >
                            {row.cells[index] ?? ''}
                          </TableCell>
                        ))}
                        <TableCell>
                          <Badge className={cn(statusClassName(row.status))}>
                            {t(STATUS_LABEL_KEY[row.status])}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={cn(
                            'whitespace-normal text-xs',
                            failed ? 'text-destructive' : 'text-muted-foreground',
                          )}
                        >
                          {row.message ?? ''}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex-wrap gap-2">
            <p className="text-xs text-muted-foreground">{t('csvSkippedReassurance')}</p>
            <div className="ml-auto flex gap-2">
              {errorCount > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={downloadErrorReport}>
                  <Download /> {t('csvDownloadErrorReport')}
                </Button>
              )}
              <Button
                size="sm"
                disabled={!canCommit}
                onClick={() => file && commitMutation.mutate(file)}
              >
                <Upload /> {t('csvImportCommit', { count: result.importableRows })}
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

    </div>
  );
};
