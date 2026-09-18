import { z } from 'zod';
import { emailSchema } from '@/schemas/common';

export const deleteAccountRequestSchema = z.object({
  confirmationEmail: emailSchema,
});

export type DeleteAccountRequest = z.infer<typeof deleteAccountRequestSchema>;
