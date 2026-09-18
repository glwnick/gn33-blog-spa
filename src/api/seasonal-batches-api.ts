import type { SeasonalBatch, SeasonalBatchForm } from '@/schemas/settings';
import { seasonalBatchSchema } from '@/schemas/settings';
import API_ENDPOINTS from '@/config/api-endpoints';
import api from '@/lib/axios';

export const getSeasonalBatches = async (): Promise<Array<SeasonalBatch>> => {
  const res = await api.get(API_ENDPOINTS.adminSeasonalBatches.list);
  return seasonalBatchSchema.array().parse(res.data);
};

export const createSeasonalBatch = async (
  data: SeasonalBatchForm,
): Promise<SeasonalBatch> => {
  const res = await api.post(API_ENDPOINTS.adminSeasonalBatches.create, data);
  return seasonalBatchSchema.parse(res.data);
};

export const updateSeasonalBatch = async (
  batchId: string,
  data: SeasonalBatchForm,
): Promise<SeasonalBatch> => {
  const res = await api.put(
    API_ENDPOINTS.adminSeasonalBatches.update(batchId),
    data,
  );
  return seasonalBatchSchema.parse(res.data);
};

export const deleteSeasonalBatch = async (batchId: string): Promise<void> => {
  await api.delete(API_ENDPOINTS.adminSeasonalBatches.delete(batchId));
};
