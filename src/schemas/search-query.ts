import { z } from 'zod';

/**
 * The `q` search param shared by the feed and the dashboard. Mirrors the backend: a query under 2 characters
 * is rejected there, so drop it here rather than 400 the route loader.
 */
export const searchQuerySchema = z
  .string()
  .trim()
  .max(100)
  .transform((value) => (value.length < 2 ? '' : value))
  .catch('')
  .default('');
