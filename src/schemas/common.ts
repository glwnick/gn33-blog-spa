import z from 'zod';

export const phoneNumberSchema = z
  .string()
  .min(1, 'required')
  .refine((value) => {
    if (!value) return true;
    const cleanNumber = value.replaceAll(/\s/g, '');
    return /^\+?\d{10,15}$/.test(cleanNumber);
  }, 'phoneNumber-invalid');

// WhatsApp requires a full E.164 number (country code included) so Meta can resolve it to an account; the
// leading `+` is mandatory here, unlike the lenient profile phoneNumberSchema above.
export const whatsappPhoneNumberSchema = z
  .string()
  .min(1, 'required')
  .refine((value) => {
    const cleanNumber = value.replaceAll(/\s/g, '');
    return /^\+[1-9]\d{7,14}$/.test(cleanNumber);
  }, 'phoneNumber-invalid');

export const preferredLanguageSchema = z.enum(
  ['EN', 'ES', 'FR', 'DE', 'RO'],
  'invalid-type',
);
export type LanguageType = z.infer<typeof preferredLanguageSchema>;
export const genderSchema = z.enum(
  ['MALE', 'FEMALE', 'PREFER_NOT_TO_SAY'],
  'invalid-type',
);
export type GenderType = z.infer<typeof genderSchema>;

export const passwordSchema = z
  .string()
  .min(8, 'password-min')
  .regex(/^\S*$/, 'password-noWhitespace')
  .regex(/.*\d.*/, 'password-noDigit')
  .regex(/[a-z]/, 'password-noLowercase')
  .regex(/[A-Z]/, 'password-noUppercase')
  .regex(/[^A-Za-z0-9]/, 'password-noSpecial');

export const twoFactorSchema = z.enum(['NONE', 'OTP', 'TOTP']);

export type TwoFactorType = z.infer<typeof twoFactorSchema>;

export const signInSchema = z.enum([
  'FORM_LOGIN',
  'OAUTH2_GOOGLE',
  'OAUTH2_FACEBOOK',
]);

export type SignInType = z.infer<typeof signInSchema>;

export const emailSchema = z.email('email-invalid');

export const requiredStringSchema = z.string().min(1, 'required');

// Date/time wire primitives, one per semantic category (see
// PLAN-datetime-standardization.md). Import these instead of spelling
// `z.iso.*` inline so the category-to-primitive mapping stays greppable.
export const dateTimeSchema = z.iso.datetime({ local: true });
export const dateSchema = z.iso.date();
export const timeSchema = z.iso.time();

export const auditListSchema = z.object({
  createdBy: z.string(),
  createdDate: dateTimeSchema,
  lastModifiedBy: z.string(),
  lastModifiedDate: dateTimeSchema,
});

export const pictureSchema = z
  .file()
  .refine((file) => file.type.startsWith('image/'), 'file-invalid')
  .refine((file) => file.size < 5 * 1024 * 1024, 'file-tooLarge')
  .optional();

export const blobToFileSchema = z
  .instanceof(Blob)
  .transform((blob) => {
    return new File([blob], 'nume_fisier_implicit', { type: blob.type });
  })
  .optional();

export const createObjectResponseSchema = z.object({
  objectId: z.string(),
});

export type CreateObjectResponse = z.infer<typeof createObjectResponseSchema>;
