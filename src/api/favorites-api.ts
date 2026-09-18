import type { Page, PageResponse } from '@/types/pageable';
import type { ProductSummary } from '@/schemas/products';
import { productSummarySchema } from '@/schemas/products';
import API_ENDPOINTS from '@/config/api-endpoints';
import api from '@/lib/axios';

export const getMyFavorites = async (
  pagination: { page: number; size: number },
): Promise<Page<ProductSummary>> => {
  const res = await api.get<PageResponse<ProductSummary>>(API_ENDPOINTS.favorites.list, {
    params: pagination,
  });

  return {
    ...res.data.page,
    content: res.data.content.map((item) => productSummarySchema.parse(item)),
  };
};

export const addFavorite = async (productId: string): Promise<void> => {
  await api.post(API_ENDPOINTS.favorites.add(productId));
};

export const removeFavorite = async (productId: string): Promise<void> => {
  await api.delete(API_ENDPOINTS.favorites.remove(productId));
};
