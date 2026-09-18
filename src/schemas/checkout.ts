import { z } from 'zod';
import {
  emailSchema,
  passwordSchema,
  phoneNumberSchema,
  requiredStringSchema,
} from './common';

/** Doubles as ship-to and bill-to this slice - see `OrderEntity`'s javadoc on the backend. */
export const checkoutAddressSchema = z.object({
  fullName: requiredStringSchema,
  phone: phoneNumberSchema,
  street: requiredStringSchema,
  city: requiredStringSchema,
  postalCode: requiredStringSchema,
  companyName: z.string().optional(),
  companyCui: z.string().optional(),
});
export type CheckoutAddress = z.infer<typeof checkoutAddressSchema>;

/** The blank address shape, shared by the checkout form's own defaults below and by anything else that needs
 * an empty starting point for this shape - e.g. `ProfileAddressCard` when nothing is saved yet. */
export const emptyCheckoutAddress: CheckoutAddress = {
  fullName: '',
  phone: '',
  street: '',
  city: '',
  postalCode: '',
  companyName: '',
  companyCui: '',
};

/**
 * `createAccount`/`firstName`/`lastName`/`password` are only required when the "create an
 * account" checkbox is ticked - enforced below with `superRefine` rather than making them
 * unconditionally required, since a guest checkout never fills them in.
 */
export const checkoutFormSchema = z
  .object({
    email: emailSchema,
    address: checkoutAddressSchema,
    termsAccepted: z
      .boolean()
      .refine((value) => value === true, 'termsAccepted-invalid'),
    returnsPolicyAccepted: z
      .boolean()
      .refine((value) => value === true, 'returnsPolicyAccepted-invalid'),
    // A single acknowledgment gates every made-to-order/one-of-a-kind cart line at once, mirroring
    // the design handoff's single acknowledgment sentence rather than one checkbox per line.
    personalisationAcknowledged: z.boolean(),
    createAccount: z.boolean(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    password: z.string().optional(),
    // Only meaningful for a signed-in shopper (or one ticking createAccount) - OrderServiceImpl.resolveIdentity
    // ignores it for a true guest checkout, which has no profile to save onto.
    saveAddress: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (!values.createAccount) {
      return;
    }
    if (!values.firstName) {
      ctx.addIssue({
        code: 'custom',
        path: ['firstName'],
        message: 'required',
      });
    }
    if (!values.lastName) {
      ctx.addIssue({ code: 'custom', path: ['lastName'], message: 'required' });
    }
    const password = passwordSchema.safeParse(values.password);
    if (!password.success) {
      ctx.addIssue({
        code: 'custom',
        path: ['password'],
        message: password.error.issues[0]?.message ?? 'password-min',
      });
    }
  });
export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export const defaultCheckoutFormValues: CheckoutFormValues = {
  email: '',
  address: emptyCheckoutAddress,
  termsAccepted: false,
  returnsPolicyAccepted: false,
  personalisationAcknowledged: false,
  createAccount: false,
  firstName: '',
  lastName: '',
  password: '',
  saveAddress: false,
};

/** The wire payload's line shape - `variantId`/`quantity`/`personalisationAcknowledged` only, never a price. */
export type CheckoutLineRequest = {
  variantId: string;
  quantity: number;
  personalisationAcknowledged: boolean;
};

export type CheckoutRequest = {
  email: string;
  lines: Array<CheckoutLineRequest>;
  address: CheckoutAddress;
  termsAccepted: boolean;
  returnsPolicyAccepted: boolean;
  createAccount: boolean;
  firstName?: string;
  lastName?: string;
  password?: string;
  saveAddress: boolean;
};

/**
 * What the cart and checkout summaries have to state before an order exists: the real delivery cost, and how
 * long the free-cancellation window runs. Both come from one public read - see the backend's
 * `StorefrontConfigResponseDto` for why this is not the admin-fidelity `AppSettingsResponseDto`.
 */
export const storefrontConfigSchema = z.object({
  flatRate: z.number(),
  freeShippingThreshold: z.number().nullable(),
  /** `0` means self-serve cancellation is switched off, so the cart's reassurance note is suppressed. */
  orderCancellationWindowHours: z.number().int(),
});
export type StorefrontConfig = z.infer<typeof storefrontConfigSchema>;

// `orderStatusSchema`/`orderLineSchema`/`orderConfirmationSchema` moved to `schemas/orders.ts` (slice 4): that
// module owns the read path and re-exports the write path's `checkoutAddressSchema` it still needs, rather than
// forking a second copy of any of the three.
