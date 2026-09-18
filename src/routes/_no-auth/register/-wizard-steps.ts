import type { UserSignUpInput } from '@/schemas/auth';
import type { StepValidatableForm } from '@/lib/validate-form-fields';
import { validateFormFields } from '@/lib/validate-form-fields';

export const TOTAL_STEPS = 6;

export const STEP_FIELDS: Partial<
  Record<number, ReadonlyArray<keyof UserSignUpInput>>
> = {
  1: ['email', 'password'],
  2: ['firstName', 'lastName', 'phoneNumber'],
  3: ['termsAccepted', 'gdprConsentGiven'],
};

export const STEP_NAME_KEYS = [
  'registerStepAccount',
  'registerStepPersonal',
  'registerStepConsents',
  'registerStepPin',
  'registerStepPhoto',
  'registerStepDone',
] as const;

export const fieldOwningStep = (field: string): number | undefined => {
  for (const [step, fields] of Object.entries(STEP_FIELDS)) {
    if ((fields as ReadonlyArray<string>).includes(field)) {
      return Number(step);
    }
  }
  return undefined;
};

// Validates only the given step's fields on the shared wizard form. The mechanics live in
// `lib/validate-form-fields.ts`, shared with the checkout form's own steps; this keeps the
// register-specific step->fields lookup.
export const validateWizardStep = async (
  form: StepValidatableForm,
  step: number,
): Promise<boolean> => {
  const fields = STEP_FIELDS[step];
  if (!fields) return true;
  return validateFormFields(form, fields);
};
