import type { Category } from '@/schemas/products';
import { categorySchema } from '@/schemas/products';
import API_ENDPOINTS from '@/config/api-endpoints';
import api from '@/lib/axios';

export const getCategories = async (): Promise<Array<Category>> => {
  const res = await api.get(API_ENDPOINTS.categories.list);
  return categorySchema.array().parse(res.data);
};
