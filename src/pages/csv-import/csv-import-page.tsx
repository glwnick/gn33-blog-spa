import { useState } from 'react';
import { Download } from 'lucide-react';
import type { ImportCardConfig, RecentImport } from '@/pages/csv-import/import-card';
import type { CsvImportKind } from '@/schemas/csv-import';
import { AppContent } from '@/components/layout/app-content';
import { useTranslation } from '@/hooks/use-translation';
import { ImportCard } from '@/pages/csv-import/import-card';
import { PRODUCT_KEY } from '@/query-options/product-options';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { downloadCsv } from '@/lib/csv-download';
import { formatDateTime } from '@/lib/formatting';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const USERS_CONFIG: ImportCardConfig = {
  kind: 'users',
  titleKey: 'csvUsersTitle',
  descriptionKey: 'csvUsersHint',
  columns: [
    'firstName',
    'lastName',
    'email',
    'phoneNumber',
    'gender',
    'dateOfBirth',
    'language',
  ],
  sample: [
    'Jane',
    'Doe',
    'jane.doe@example.com',
    '+40712345678',
    'FEMALE',
    '1990-05-20',
    'en',
  ],
};

const STOCK_LEVELS_CONFIG: ImportCardConfig = {
  kind: 'stockLevels',
  titleKey: 'csvStockLevelsTitle',
  descriptionKey: 'csvStockLevelsHint',
  columns: ['sku', 'stock'],
  sample: ['SKU-1234', '12'],
  invalidateKey: PRODUCT_KEY,
};

const CONFIGS: Record<Exclude<CsvImportKind, never>, ImportCardConfig> = {
  users: USERS_CONFIG,
  stockLevels: STOCK_LEVELS_CONFIG,
};

export function CsvImportPage() {
  const { t } = useTranslation();
  // 'products' has no config - see the disabled pill below and the slice 7 plan's conflict-resolution
  // section for why a full product-create CSV import isn't built.
  const [target, setTarget] = useState<CsvImportKind>('users');
  /**
   * Session-scoped, deliberately. The handoff's rail shows what has been imported recently, and there is no
   * import-history table to read - adding one is a domain decision, not a layout one. Within a session it
   * still answers the question the rail exists for ("did that stock file go through?"), and it is honest
   * about its scope by simply being empty on arrival.
   */
  const [recentImports, setRecentImports] = useState<ReadonlyArray<RecentImport>>([]);

  const config = CONFIGS[target];

  return (
    <AppContent title={t('csvImport')}>
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={target === 'users' ? 'default' : 'outline'}
              onClick={() => setTarget('users')}
            >
              {t('csvTargetCustomers')}
            </Button>
            <Button
              size="sm"
              variant={target === 'stockLevels' ? 'default' : 'outline'}
              onClick={() => setTarget('stockLevels')}
            >
              {t('csvTargetStockLevels')}
            </Button>
            <Tooltip>
              <TooltipTrigger
                render={
                  <span
                    className={cn(
                      buttonVariants({ size: 'sm', variant: 'outline' }),
                      'cursor-not-allowed opacity-50',
                    )}
                  />
                }
              >
                {t('csvTargetProducts')}
              </TooltipTrigger>
              <TooltipContent>{t('csvTargetProductsHint')}</TooltipContent>
            </Tooltip>
          </div>

          {/* Keyed on the target so switching pills drops the previous run's file, preview and parse timing
              rather than showing a stock-levels preview under a customers header. */}
          <ImportCard
            key={target}
            config={config}
            onImported={(entry) => setRecentImports((prev) => [entry, ...prev].slice(0, 5))}
          />
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('csvExpectedColumns')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <ul className="flex flex-col gap-1">
                {config.columns.map((column) => (
                  <li key={column} className="font-mono text-xs text-muted-foreground">
                    {column}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadCsv(`${config.kind}-template.csv`, [config.columns, config.sample])
                }
              >
                <Download /> {t('csvDownloadTemplate')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('csvRecentImports')}</CardTitle>
            </CardHeader>
            <CardContent>
              {recentImports.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t('csvRecentImportsEmpty')}</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {recentImports.map((entry) => (
                    <li key={entry.id} className="flex items-start gap-2 text-xs">
                      <span
                        className={cn(
                          'mt-1.5 size-[7px] shrink-0 rounded-full',
                          entry.skipped > 0 ? 'bg-destructive' : 'bg-primary',
                        )}
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-mono">{entry.fileName}</span>
                        <span className="text-muted-foreground">
                          {t('csvRecentImportSummary', {
                            imported: entry.imported,
                            skipped: entry.skipped,
                          })}
                        </span>
                        <span className="text-muted-foreground">
                          {/* The `Date` overload, not an ISO string: `at` is a real local instant this
                              session produced, so round-tripping it through UTC text would only risk
                              shifting it. */}
                          {formatDateTime(entry.at)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppContent>
  );
}
