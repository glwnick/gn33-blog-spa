import type { FC } from 'react';
import type { FormFieldProps } from '@/types/form';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useFieldContext } from '@/hooks/use-form-context';
import { formatPhoneNumber } from '@/lib/formatting';
import TranslatedFieldError from '@/components/form/translated-field-error';

const PhoneField: FC<FormFieldProps> = ({ label, mandatoryLabel = false }) => {
  const field = useFieldContext<string>();

  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name} mandatory={mandatoryLabel}>
        {label}
      </FieldLabel>

      <Input
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        type="text"
        value={field.state.value || ''}
        onChange={(e) => {
          const formatted = formatPhoneNumber(e.target.value);
          field.handleChange(formatted);
        }}
        aria-invalid={isInvalid}
      />
      {isInvalid && <TranslatedFieldError errors={field.state.meta.errors} />}
    </Field>
  );
};

export default PhoneField;
