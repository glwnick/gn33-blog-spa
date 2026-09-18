import { z } from 'zod';
import type { CollectionType } from '@/schemas/collections';
import api from '@/lib/axios';
import API_ENDPOINTS from '@/config/api-endpoints';
import { collectionTypeSchema } from '@/schemas/collections';

export type { CollectionType };

const parseCollection = (data: unknown): Array<CollectionType> =>
  z.array(collectionTypeSchema).parse(data);

export const getGenders = async (): Promise<Array<CollectionType>> => {
  const res = await api.get<Array<CollectionType>>(
    API_ENDPOINTS.collections.genders,
  );
  return parseCollection(res.data);
};

export const getTwoFactorTypes = async (): Promise<Array<CollectionType>> => {
  const res = await api.get<Array<CollectionType>>(
    API_ENDPOINTS.collections.twoFactorTypes,
  );
  return parseCollection(res.data);
};

export const getLanguages = async (): Promise<Array<CollectionType>> => {
  const res = await api.get<Array<CollectionType>>(
    API_ENDPOINTS.collections.languages,
  );
  return parseCollection(res.data);
};



