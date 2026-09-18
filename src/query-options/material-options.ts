import { queryOptions } from '@tanstack/react-query';
import { DEFAULT_STALE_TIME } from '@/config/query';
import { getAdminMaterials, getProductsUsingMaterial } from '@/api/materials-api';

export const MATERIAL_KEY = 'materials' as const;

/** The whole list. Small and slow-changing, so it is one unpaginated list, like yarns and categories. */
export const adminMaterialsOptions = () => {
  return queryOptions({
    queryKey: [MATERIAL_KEY, 'admin'],
    queryFn: getAdminMaterials,
    staleTime: DEFAULT_STALE_TIME,
  });
};

/**
 * Only fetched when the delete dialog opens for a material that is in use - the list itself already carries the
 * count, and the names are just what that count is made of.
 */
export const materialProductsOptions = (materialId: string, enabled: boolean) => {
  return queryOptions({
    queryKey: [MATERIAL_KEY, 'products', materialId],
    queryFn: () => getProductsUsingMaterial(materialId),
    staleTime: DEFAULT_STALE_TIME,
    enabled,
  });
};
