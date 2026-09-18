// TanStack Form's generics make concrete FormApi instances mutually unassignable (e.g. AnyFormApi rejects a
// bare FormApi); this narrow any-based structural slice fits both an app form instance and a bare FormApi in
// tests. Lifted out of `routes/_no-auth/register/-wizard-steps.ts` when checkout gained steps of its own -
// two multi-step forms in the app, one implementation of "may this step advance".
export type StepValidatableForm = {
  state: { submissionAttempts: number };
  baseStore: { setState: (updater: (prev: any) => any) => void };
  setFieldMeta: (field: any, updater: (prev: any) => any) => void;
  validate: (
    cause: 'submit',
    opts: { filterFieldNames: (name: any) => boolean },
  ) => unknown;
  getFieldMeta: (field: any) => { errors: Array<unknown> } | undefined;
};

/**
 * Validates only the given fields on a shared multi-step form: marks them touched so their errors display,
 * runs the form's submit-cause validators filtered to those fields, and reports whether the step may advance.
 *
 * <p>Nested field names ("address.city") match by prefix, because a zod object schema reports the error on the
 * leaf path while the step owns the whole branch.
 */
export const validateFormFields = async (
  form: StepValidatableForm,
  fields: ReadonlyArray<string>,
): Promise<boolean> => {
  if (fields.length === 0) return true;

  fields.forEach((name) =>
    form.setFieldMeta(name, (prev) => ({ ...prev, isTouched: true })),
  );
  await form.validate('submit', {
    filterFieldNames: (name) => fields.includes(String(name)),
  });

  const valid = fields.every(
    (name) => (form.getFieldMeta(name)?.errors.length ?? 0) === 0,
  );
  // revalidateLogic only re-runs the schema on change once a submission was attempted; form.validate does not
  // count as one, so bump the counter on the first failure to make errors clear live as the user types,
  // exactly as a failed handleSubmit would.
  if (!valid && form.state.submissionAttempts === 0) {
    form.baseStore.setState((prev) => ({
      ...prev,
      submissionAttempts: prev.submissionAttempts + 1,
    }));
  }
  return valid;
};
