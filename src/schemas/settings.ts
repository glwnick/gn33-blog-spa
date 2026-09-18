import { z } from 'zod';
import { dateSchema, dateTimeSchema } from './common';

/**
 * Server view of the application settings.
 *
 * <p>One setting for now: how many hours after placing an order a customer may still cancel it themselves, where 0
 * disables self-serve cancellation. The seven fitness settings this replaced (booking cutoff, review threshold,
 * waitlist flag, schedule horizon, class reminder, subscription freeze cap, no-show policy) went with that domain.
 *
 * <p>{@code lastModifiedBy}/{@code lastModifiedDate} back the "Last changed {date} by {user}" footer (slice 7) -
 * both null until the setting has been customised at least once.
 */
export const appSettingsResponseSchema = z.object({
  orderCancellationWindowHours: z.number().int().min(0),
  lastModifiedBy: z.string().nullable(),
  lastModifiedDate: dateTimeSchema.nullable(),
});

export type AppSettingsResponse = z.infer<typeof appSettingsResponseSchema>;

/** Form model for the order-cancellation settings card. */
export const orderCancellationSettingsFormSchema = z.object({
  orderCancellationWindowHours: z
    .number('required')
    .int('required')
    .min(0, 'fieldMinValue'),
});

export type OrderCancellationSettingsForm = z.infer<
  typeof orderCancellationSettingsFormSchema
>;

// --- Slice 7: seasonal batches -------------------------------------------------------------------------------

export const seasonalBatchStatusSchema = z.enum(['PLANNED', 'OPEN', 'CLOSED']);
export type SeasonalBatchStatus = z.infer<typeof seasonalBatchStatusSchema>;

export const seasonalBatchSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  startsOn: dateSchema,
  endsOn: dateSchema,
  capacity: z.number().int().min(0),
  status: seasonalBatchStatusSchema,
});
export type SeasonalBatch = z.infer<typeof seasonalBatchSchema>;

export const seasonalBatchFormSchema = z
  .object({
    name: z.string().min(1, 'required'),
    startsOn: z.iso.date('date-invalid'),
    endsOn: z.iso.date('date-invalid'),
    capacity: z.number('required').int('required').min(0, 'fieldMinValue'),
    status: seasonalBatchStatusSchema,
  })
  .refine((value) => value.endsOn >= value.startsOn, {
    message: 'seasonalBatchEndBeforeStart',
    path: ['endsOn'],
  });
export type SeasonalBatchForm = z.infer<typeof seasonalBatchFormSchema>;
