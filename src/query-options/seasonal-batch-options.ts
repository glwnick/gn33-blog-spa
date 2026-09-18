import { queryOptions } from '@tanstack/react-query';
import { DEFAULT_STALE_TIME } from '@/config/query';
import { getSeasonalBatches } from '@/api/seasonal-batches-api';

export const SEASONAL_BATCH_KEY = 'seasonal-batches' as const;

export const seasonalBatchesOptions = () =>
  queryOptions({
    queryKey: [SEASONAL_BATCH_KEY],
    queryFn: () => getSeasonalBatches(),
    staleTime: DEFAULT_STALE_TIME,
  });
