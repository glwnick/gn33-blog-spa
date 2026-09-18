import { FormApi, revalidateLogic } from '@tanstack/react-form';
import { describe, expect, it } from 'vitest';
import {
  STEP_FIELDS,
  TOTAL_STEPS,
  fieldOwningStep,
  validateWizardStep,
} from './-wizard-steps';
import {
  defaultUserSignUpInputValues,
  userSignInInputSchema,
} from '@/schemas/auth';

const createWizardForm = () => {
  const form = new FormApi({
    defaultValues: defaultUserSignUpInputValues,
    validators: { onDynamic: userSignInInputSchema },
    validationLogic: revalidateLogic(),
  });
  form.mount();
  return form;
};

describe('fieldOwningStep', () => {
  it('maps each field to the step that owns it', () => {
    expect(fieldOwningStep('email')).toBe(1);
    expect(fieldOwningStep('password')).toBe(1);
    expect(fieldOwningStep('firstName')).toBe(2);
    expect(fieldOwningStep('lastName')).toBe(2);
    expect(fieldOwningStep('phoneNumber')).toBe(2);
    expect(fieldOwningStep('termsAccepted')).toBe(3);
    expect(fieldOwningStep('gdprConsentGiven')).toBe(3);
  });

  it('returns undefined for a field with no owning step, so callers default to Account', () => {
    expect(fieldOwningStep('pinCode')).toBeUndefined();
    expect(fieldOwningStep('unknownField')).toBeUndefined();
  });
});

describe('STEP_FIELDS', () => {
  it('only gates steps 1-3, the ones sharing the single form instance', () => {
    expect(Object.keys(STEP_FIELDS).map(Number).sort()).toEqual([1, 2, 3]);
  });
});

describe('TOTAL_STEPS', () => {
  it('matches the six-step wizard (Account, Personal, Consents, PIN, Photo, Done)', () => {
    expect(TOTAL_STEPS).toBe(6);
  });
});

describe('validateWizardStep', () => {
  it("blocks an invalid step and surfaces errors only on that step's fields", async () => {
    const form = createWizardForm();

    expect(await validateWizardStep(form, 1)).toBe(false);
    expect(form.getFieldMeta('email')?.errors.length).toBeGreaterThan(0);
    expect(form.getFieldMeta('password')?.errors.length).toBeGreaterThan(0);
    // Step 2's fields are also empty/invalid but must not be validated yet.
    expect(form.getFieldMeta('firstName')?.errors ?? []).toHaveLength(0);
  });

  it('advances a valid step even while later steps are still invalid', async () => {
    const form = createWizardForm();
    form.setFieldValue('email', 'member@example.com');
    form.setFieldValue('password', 'Passw0rd!123');

    expect(await validateWizardStep(form, 1)).toBe(true);
    expect(await validateWizardStep(form, 2)).toBe(false);
    expect(await validateWizardStep(form, 3)).toBe(false);
  });

  it('treats steps without gated fields (PIN, Photo, Done) as always valid', async () => {
    const form = createWizardForm();
    for (const step of [4, 5, 6]) {
      expect(await validateWizardStep(form, step)).toBe(true);
    }
  });

  it('keeps entered values intact across validation, so Back preserves them', async () => {
    const form = createWizardForm();
    form.setFieldValue('email', 'member@example.com');
    form.setFieldValue('password', 'Passw0rd!123');
    form.setFieldValue('firstName', 'Ada');

    await validateWizardStep(form, 1);
    await validateWizardStep(form, 2);

    expect(form.state.values.email).toBe('member@example.com');
    expect(form.state.values.password).toBe('Passw0rd!123');
    expect(form.state.values.firstName).toBe('Ada');
  });

  it('switches revalidateLogic to its after-submission mode on the first failure, so errors clear as the user types', async () => {
    const form = createWizardForm();

    expect(form.state.submissionAttempts).toBe(0);
    expect(await validateWizardStep(form, 1)).toBe(false);
    expect(form.state.submissionAttempts).toBe(1);
  });

  it('does not count a successful validation as a submission attempt', async () => {
    const form = createWizardForm();
    form.setFieldValue('email', 'member@example.com');
    form.setFieldValue('password', 'Passw0rd!123');

    expect(await validateWizardStep(form, 1)).toBe(true);
    expect(form.state.submissionAttempts).toBe(0);
  });
});
