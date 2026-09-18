import { queryOptions } from '@tanstack/react-query';
import type { CollectionType } from '@/schemas/collections';
import { COLLECTION_STALE_TIME } from '@/config/query';
import {
  getGenders,
  getLanguages,
  getTwoFactorTypes,
} from '@/api/collections-api';
import { getStoredLanguage } from '@/lib/i18n';

export type SelectOptionItem = {
  label: string;
  value: string;
};

export type SelectOptionContentItem = SelectOptionItem & {
  content?: () => React.ReactNode;
};

const mapToSelectItem = (
  data: Array<CollectionType>,
): Array<SelectOptionItem> =>
  data.map((item) => ({
    label: item.localizedMessage,
    value: item.key,
  }));

export const gendersOptions = () => {
  return queryOptions({
    queryKey: ['genders', getStoredLanguage()],
    queryFn: getGenders,
    staleTime: COLLECTION_STALE_TIME,
    select: (data) => mapToSelectItem(data),
  });
};

export const twoFactorTypesOptions = () => {
  return queryOptions({
    queryKey: ['two-factor-types', getStoredLanguage()],
    queryFn: getTwoFactorTypes,
    staleTime: COLLECTION_STALE_TIME,
    select: (data) => mapToSelectItem(data),
  });
};

export const languagesOptions = () => {
  return queryOptions({
    queryKey: ['languages', getStoredLanguage()],
    queryFn: getLanguages,
    staleTime: COLLECTION_STALE_TIME,
    select: (data) => mapToSelectItem(data),
  });
};
