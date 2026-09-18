import type { Page, PageResponse } from '@/types/pageable';
import type { CreateObjectResponse } from '@/schemas/common';
import type { ProductStatus } from '@/schemas/products';
import type {
  AdminProductDefaults,
  AdminProductDetail,
  AdminProductImage,
  AdminProductImageOrderInput,
  AdminProductListFilters,
  AdminProductSaveInput,
  AdminProductSummary,
} from '@/schemas/admin-products';
import {
  adminProductDefaultsSchema,
  adminProductDetailSchema,
  adminProductImageSchema,
  adminProductSummarySchema,
} from '@/schemas/admin-products';
import API_ENDPOINTS from '@/config/api-endpoints';
import api from '@/lib/axios';

export const getAdminProducts = async (
  filters: AdminProductListFilters,
): Promise<Page<AdminProductSummary>> => {
  const res = await api.get<PageResponse<AdminProductSummary>>(
    API_ENDPOINTS.adminProducts.list,
    { params: filters },
  );

  return {
    ...res.data.page,
    content: res.data.content.map((item) => adminProductSummarySchema.parse(item)),
  };
};

export const getAdminProductDefaults = async (): Promise<AdminProductDefaults> => {
  const res = await api.get(API_ENDPOINTS.adminProducts.defaults);
  return adminProductDefaultsSchema.parse(res.data);
};

export const getAdminProduct = async (
  productId: string,
): Promise<AdminProductDetail> => {
  const res = await api.get(API_ENDPOINTS.adminProducts.detail(productId));
  return adminProductDetailSchema.parse(res.data);
};

export const createAdminProduct = async (
  data: AdminProductSaveInput,
): Promise<CreateObjectResponse> => {
  const res = await api.post<CreateObjectResponse>(
    API_ENDPOINTS.adminProducts.create,
    data,
  );
  return res.data;
};

export const updateAdminProduct = async (
  productId: string,
  data: AdminProductSaveInput,
): Promise<AdminProductDetail> => {
  const res = await api.put(API_ENDPOINTS.adminProducts.update(productId), data);
  return adminProductDetailSchema.parse(res.data);
};

export const updateAdminProductStatus = async (
  productId: string,
  status: ProductStatus,
): Promise<AdminProductDetail> => {
  const res = await api.put(API_ENDPOINTS.adminProducts.status(productId), {
    status,
  });
  return adminProductDetailSchema.parse(res.data);
};

export const updateAdminProductFeatured = async (
  productId: string,
  featured: boolean,
): Promise<AdminProductDetail> => {
  const res = await api.put(API_ENDPOINTS.adminProducts.featured(productId), {
    featured,
  });
  return adminProductDetailSchema.parse(res.data);
};

export const duplicateAdminProduct = async (
  productId: string,
): Promise<CreateObjectResponse> => {
  const res = await api.post<CreateObjectResponse>(
    API_ENDPOINTS.adminProducts.duplicate(productId),
  );
  return res.data;
};

export const adjustVariantStock = async (
  variantId: string,
  stock: number,
): Promise<void> => {
  await api.post(API_ENDPOINTS.adminProducts.adjustStock(variantId), { stock });
};

export const deleteAdminProduct = async (productId: string): Promise<void> => {
  await api.delete(API_ENDPOINTS.adminProducts.delete(productId));
};

export type UploadAdminProductImageInput = {
  file: File;
  altText: string;
  variantId?: string;
  isPrimary?: boolean;
};

export const uploadAdminProductImage = async (
  productId: string,
  { file, altText, variantId, isPrimary }: UploadAdminProductImageInput,
): Promise<AdminProductImage> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('altText', altText);
  if (variantId) {
    formData.append('variantId', variantId);
  }
  if (isPrimary !== undefined) {
    formData.append('isPrimary', String(isPrimary));
  }
  const res = await api.post(API_ENDPOINTS.adminProducts.uploadImage(productId), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return adminProductImageSchema.parse(res.data);
};

export const reorderAdminProductImages = async (
  productId: string,
  data: AdminProductImageOrderInput,
): Promise<void> => {
  await api.put(API_ENDPOINTS.adminProducts.reorderImages(productId), data);
};

export const deleteAdminProductImage = async (
  productId: string,
  imageId: string,
): Promise<void> => {
  await api.delete(API_ENDPOINTS.adminProducts.deleteImage(productId, imageId));
};
