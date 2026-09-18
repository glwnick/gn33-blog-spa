import { z } from 'zod';
import {
  emailSchema,
  passwordSchema,
  phoneNumberSchema,
  requiredStringSchema,
} from './common';

// Login
export const loginInputSchema = z.object({
  email: emailSchema,
  password: requiredStringSchema,
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const defaultLoginInputValues: LoginInput = {
  email: '',
  password: '',
};

// Sign Up (registration wizard: one sub-schema per step, composed for the full payload)
export const registerAccountStepSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerPersonalStepSchema = z.object({
  firstName: requiredStringSchema,
  lastName: requiredStringSchema,
  phoneNumber: phoneNumberSchema,
});

export const registerConsentsStepSchema = z.object({
  gdprConsentGiven: z
    .boolean()
    .refine((value) => value === true, 'gdprConsentGiven-invalid'),
  gdprConsentDetails: z.string().optional(),
  termsAccepted: z
    .boolean()
    .refine((value) => value === true, 'termsAccepted-invalid'),
});

export const userSignInInputSchema = registerAccountStepSchema
  .extend(registerPersonalStepSchema.shape)
  .extend(registerConsentsStepSchema.shape)
  .extend({
    pinCode: z.string().optional(),
  });

export type UserSignUpInput = z.infer<typeof userSignInInputSchema>;

export const defaultUserSignUpInputValues: UserSignUpInput = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  gdprConsentGiven: false,
  gdprConsentDetails: '',
  termsAccepted: false,
};

// Reset Password
export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'password-mismatch',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const defaultResetPasswordInputValues: ResetPasswordInput = {
  newPassword: '',
  confirmPassword: '',
};
