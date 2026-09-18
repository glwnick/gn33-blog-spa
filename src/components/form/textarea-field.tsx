import type { FC } from 'react';
import type { FormFieldProps } from '@/types/form';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { useFieldContext } from '@/hooks/use-form-context';
import TranslatedFieldError from '@/components/form/translated-field-error';

const TextareaField: FC<FormFieldProps> = ({
  label,
  description,
  mandatoryLabel = false,
  placeholder,
}) => {
  const field = useFieldContext<string>();

  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name} mandatory={mandatoryLabel}>
        {label}
      </FieldLabel>
      <Textarea
        id={field.name}
        name={field.name}
        placeholder={placeholder}
        onBlur={field.handleBlur}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <TranslatedFieldError errors={field.state.meta.errors} />}
    </Field>
  );
};

export default TextareaField;
