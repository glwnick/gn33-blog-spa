import { z } from 'zod';
import { PAGE_SIZES } from '@/config/table';

type Pageable = {
  readonly number: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
};

export type Page<T> = Pageable & {
  content: Array<T>;
};

export type PageResponse<T> = {
  content: Array<T>;
  readonly page: Pageable;
};

const pageSizes = PAGE_SIZES.map((s) => z.literal(s)) as [
  z.ZodLiteral<(typeof PAGE_SIZES)[number]>,
  ...Array<z.ZodLiteral<(typeof PAGE_SIZES)[number]>>,
];

export const paginationParamsSchema = z.object({
  page: z.number().int().positive().optional().catch(undefined),
  size: z.union(pageSizes).optional().catch(undefined),
});

export const sortParamsSchema = z
  .string()
  .regex(/^[a-zA-Z_]+,(asc|desc)$/)
  .optional()
  .catch(undefined);

export const paginationSchema = paginationParamsSchema.extend({
  sort: sortParamsSchema,
});

export type PaginationParams = z.infer<typeof paginationParamsSchema>;
export type SortParams = { sort: `${string},${'asc' | 'desc'}` };
export type Filters<T> = Partial<T & PaginationParams & SortParams>;

// The trailing `Array<unknown>` is for a display-only column like a list of chips (e.g. a product's
// categories) - never a filterable field itself, since a filter value has to serialize into one URL param.
export type BaseTableRow = Record<
  string,
  string | number | boolean | Date | null | undefined | Array<unknown>
>;

export const filtersFor = <T extends z.ZodRawShape>(shape: T) => {
  const optionalShape = Object.fromEntries(
    Object.entries(shape).map(([key, schema]) => [
      key,
      (schema as z.ZodTypeAny).optional().catch(console.error),
    ]),
  ) as unknown as { [K in keyof T]: z.ZodOptional<z.ZodCatch<T[K]>> };

  return paginationSchema.extend(optionalShape);
};
