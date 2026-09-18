import { DEFAULT_PAGE_INDEX, DEFAULT_PAGE_SIZE } from '@/config/table';

export const cleanEmptyParams = <T extends Record<string, unknown>>(
  search: T,
) => {
  const newSearch = { ...search };
  Object.keys(newSearch).forEach((key) => {
    const value = newSearch[key];
    if (
      value === undefined ||
      value === '' ||
      (typeof value === 'number' && Number.isNaN(value))
    )
      delete newSearch[key];
  });

  if (search.page === DEFAULT_PAGE_INDEX) delete newSearch.page;
  if (search.size === DEFAULT_PAGE_SIZE) delete newSearch.size;

  return newSearch;
};
