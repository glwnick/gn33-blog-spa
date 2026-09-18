import type { FC } from 'react';
import type { FormFieldProps } from '@/types/form';
import { Field, FieldLabel } from '@/components/ui/field';
import { DatePicker } from '@/components/date-picker';
import { useFieldContext } from '@/hooks/use-form-context';
import TranslatedFieldError from '@/components/form/translated-field-error';

// Date-only field (category C). Wire contract is `YYYY-MM-DD`. Selectable range
// is unbounded by default; pass minDate/maxDate to constrain it (e.g. a
// birthdate field passes maxDate={today} and a floor year).
type SingleDatePickerFieldProps = FormFieldProps & {
  minDate?: Date;
  maxDate?: Date;
};

const SingleDatePickerField: FC<SingleDatePickerFieldProps> = ({
  label,
  mandatoryLabel = false,
  minDate,
  maxDate,
}) => {
  const field = useFieldContext<string | null>();

  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name} mandatory={mandatoryLabel}>
        {label}
      </FieldLabel>

      <DatePicker
        id={field.name}
        value={field.state.value ?? null}
        onChange={(value) => field.handleChange(value)}
        minDate={minDate}
        maxDate={maxDate}
        invalid={isInvalid}
      />
      {isInvalid && <TranslatedFieldError errors={field.state.meta.errors} />}
    </Field>
  );
};

export default SingleDatePickerField;
