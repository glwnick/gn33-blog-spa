import { z } from 'zod';
import type { Filters } from '@/types/pageable';
import {
  auditListSchema,
  dateSchema,
  dateTimeSchema,
  emailSchema,
  genderSchema,
  passwordSchema,
  phoneNumberSchema,
  preferredLanguageSchema,
  requiredStringSchema,
  signInSchema,
} from '@/schemas/common';
import { resetPasswordSchema } from '@/schemas/auth';
import { filtersFor } from '@/types/pageable';

// Create User
export const createUserInputSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: requiredStringSchema,
  lastName: requiredStringSchema,
  phoneNumber: phoneNumberSchema,
  preferredLanguage: preferredLanguageSchema,
  gender: genderSchema,
  dateOfBirth: z.iso.date('date-invalid').nullable(),
  gdprConsentGiven: z.boolean(),
  gdprConsentDetails: z.string().nullable(),
  termsAccepted: z.boolean(),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const defaultCreateUserInputValues: CreateUserInput = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  preferredLanguage: 'EN',
  gender: 'PREFER_NOT_TO_SAY',
  dateOfBirth: null,
  gdprConsentGiven: true,
  gdprConsentDetails: '',
  password: '',
  termsAccepted: true,
};

// Update User
export const updateUserInputSchema = z.object({
  firstName: requiredStringSchema,
  lastName: requiredStringSchema,
  email: emailSchema,
  phoneNumber: phoneNumberSchema,
  preferredLanguage: preferredLanguageSchema,
  gender: genderSchema,
  dateOfBirth: z.iso.date('date-invalid').nullable(),
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Highest role of the target user, mirroring the backend RoleType enum.
export const userRoleTypeSchema = z.enum([
  'ADMIN',
  'MANAGER',
  'INSTRUCTOR',
  'USER',
]);

export type UserRoleType = z.infer<typeof userRoleTypeSchema>;

// Get User
export const userDetailsResponseSchema = z.object({
  userId: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  phoneNumber: z.string().nullable(),
  preferredLanguage: preferredLanguageSchema,
  profilePictureUrl: z.string().nullable(),
  gender: genderSchema.nullable(),
  dateOfBirth: dateSchema.nullable(),
  enabled: z.boolean(),
  accountExpiryDate: dateSchema.nullable(),
  userRoleType: userRoleTypeSchema,
});

export type UserDetailsResponse = z.infer<typeof userDetailsResponseSchema>;

// Account status (enable/disable + access expiry)
export const accountStatusInputSchema = z.object({
  enabled: z.boolean(),
  accountExpiryDate: dateSchema.nullable(),
});

export type AccountStatusInput = z.infer<typeof accountStatusInputSchema>;

// Change password
export const changePasswordSchema = resetPasswordSchema.extend({
  currentPassword: requiredStringSchema,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const defaultChangePasswordInputValues: ChangePasswordInput = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

/** Mirrors the backend `RoleType` enum - deliberately narrower than {@link userRoleTypeSchema}, which still
 * carries the inherited `INSTRUCTOR` value nothing in this app assigns. */
export const roleFilterSchema = z.enum(['ADMIN', 'MANAGER', 'USER']);
export type RoleFilter = z.infer<typeof roleFilterSchema>;

/** Staff-only admin projection: carries email, phone and the audit stamps. Never send this to a member. */
export const userResponseSchema = auditListSchema.extend({
  userId: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  signInType: signInSchema,
  profilePictureUrl: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  lastModifiedBy: z.string(),
  lastModifiedDate: dateTimeSchema,
  // The Users table's Active/Blocked badge. `enabled` mirrors the same field `AccountStatusCard` already
  // toggles individually.
  enabled: z.boolean(),
  // M4, SECURITY-AUDIT-2026-09-15.md: distinct from `enabled` - lets `UserStatusBadge` tell a checkout-created
  // account still waiting on its verification link apart from one staff actually blocked, which look
  // identical from `enabled` alone. No backend filter exists for this yet, so it is omitted from
  // `userFiltersSchema` below rather than exposed as a toolbar filter with nothing behind it.
  emailVerified: z.boolean(),
  // The Role column: the caller's highest role (ADMIN > MANAGER > USER), batched server-side rather than
  // carried per row from a lazy collection - see `UserServiceImpl.mergeRoles`.
  userRoleType: roleFilterSchema,
});

export type UserResponse = z.infer<typeof userResponseSchema>;

export const userFiltersSchema = filtersFor({
  // `userRoleType` rides along as a real response field this time - it's the Users table's Role column
  // filter (backend's `UserFilterDto.userRoleType`), not a toolbar-only synthetic key.
  ...userResponseSchema.omit({ profilePictureUrl: true, userId: true, emailVerified: true }).shape,
  // Both overridden to the bare-date `dateSchema`, not the `dateTimeSchema` the response itself carries:
  // `ColumnFilterDate` (the Joined/Modified date column filters) emits a plain `YYYY-MM-DD`, which
  // `dateTimeSchema` rejects and `.catch()` then silently drops on the next URL round-trip.
  createdDate: dateSchema,
  lastModifiedDate: dateSchema,
  // Toolbar-only free-text search across name, email and phone (backend's `UserFilterDto.search`) - not a
  // real `UserResponse` field, unlike `userRoleType`/`enabled` above.
  search: z.string(),
});

// Not `z.infer<typeof userFiltersSchema>`: `sortParamsSchema`'s loose `z.string().regex(...)` infers as plain
// `string`, which would widen `Filters<T>`'s branded `` `${string},asc` | `${string},desc` `` sort type.
// `search` is added on top since it isn't a real `UserResponse` field - see `userFiltersSchema`.
export type UserListFilters = Filters<UserResponse> & { search?: string };

/** Slice 7's Users-table stat cards. */
export const userStatsResponseSchema = z.object({
  totalUsers: z.number().int(),
  newThisMonth: z.number().int(),
  activeAccounts: z.number().int(),
  blockedAccounts: z.number().int(),
});

export type UserStatsResponse = z.infer<typeof userStatsResponseSchema>;
