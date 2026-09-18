import z from 'zod';
import { dateTimeSchema, whatsappPhoneNumberSchema } from '@/schemas/common';

// Wire shape from PreferencesController - kept separate from the form-facing schema below because its keys
// (email/webPush/whatsapp) collide with other unrelated fields already on the profile page (the account email
// text field, for one), which would collide on id="email" since CheckboxField/TextField derive their DOM id
// from the field name.
export const notificationPreferencesResponseSchema = z.object({
  email: z.boolean(),
  webPush: z.boolean(),
  whatsapp: z.boolean(),
});

export type NotificationPreferencesResponse = z.infer<
  typeof notificationPreferencesResponseSchema
>;

export const notificationPreferencesSchema = z.object({
  notifyEmail: z.boolean(),
  notifyWebPush: z.boolean(),
  notifyWhatsapp: z.boolean(),
});

export type NotificationPreferences = z.infer<
  typeof notificationPreferencesSchema
>;

export const whatsappStatusSchema = z.object({
  optedIn: z.boolean(),
  maskedNumber: z.string().nullable(),
  verifiedAt: dateTimeSchema.nullable(),
});

export type WhatsAppStatus = z.infer<typeof whatsappStatusSchema>;

// Field is named whatsappNumber, not phoneNumber: the profile edit form (UserProfileCard) already renders a
// PhoneField named "phoneNumber", and PhoneField's id is derived from the field name - a second field of the
// same name on the same page would collide on id="phoneNumber" (duplicate DOM ids, wrong <label for> target).
export const whatsappVerificationRequestSchema = z.object({
  whatsappNumber: whatsappPhoneNumberSchema,
});

export type WhatsAppVerificationRequest = z.infer<
  typeof whatsappVerificationRequestSchema
>;
