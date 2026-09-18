import type { Page, PageResponse } from '@/types/pageable';
import type {
  CatalogueFacets,
  ProductDetail,
  ProductListFilters,
  ProductSummary,
} from '@/schemas/products';
import {
  catalogueFacetsSchema,
  productDetailSchema,
  productSummarySchema,
} from '@/schemas/products';
import API_ENDPOINTS from '@/config/api-endpoints';
import api from '@/lib/axios';
import { fileNameFromContentDisposition } from '@/lib/save-blob-as-file';

export const getProducts = async (
  filters: ProductListFilters,
  pagination: { page: number; size: number },
): Promise<Page<ProductSummary>> => {
  const res = await api.get<PageResponse<ProductSummary>>(
    API_ENDPOINTS.products.list,
    { params: { ...filters, ...pagination } },
  );

  return {
    ...res.data.page,
    content: res.data.content.map((item) => productSummarySchema.parse(item)),
  };
};

export const getCatalogueFacets = async (): Promise<CatalogueFacets> => {
  const res = await api.get(API_ENDPOINTS.products.facets);
  return catalogueFacetsSchema.parse(res.data);
};

export const getProduct = async (slug: string): Promise<ProductDetail> => {
  const res = await api.get(API_ENDPOINTS.products.detail(slug));
  return productDetailSchema.parse(res.data);
};

/**
 * Exactly the current filtered view, not the whole catalogue: `filters` is spread into `params` the same way
 * {@link getProducts} does, so the two requests serialize identically for the same filter state by construction.
 */
/**
 * The filename rides along from `Content-Disposition`: the backend brands and dates it from `app.branding.*`,
 * which the SPA has no copy of, so composing one here would drift from the name the server actually chose.
 * Null when the header is unreadable, which is the caller's cue to fall back.
 */
export const downloadCataloguePdf = async (
  filters: ProductListFilters,
): Promise<{ blob: Blob; fileName: string | null }> => {
  const res = await api.get<Blob>(API_ENDPOINTS.products.cataloguePdf, {
    params: filters,
    responseType: 'blob',
  });

  return {
    blob: res.data,
    fileName: fileNameFromContentDisposition(
      res.headers['content-disposition'] as string | undefined,
    ),
  };
};
