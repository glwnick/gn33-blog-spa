import type { FC } from 'react';
import type { FormFieldProps } from '@/types/form';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useFieldContext } from '@/hooks/use-form-context';
import TranslatedFieldError from '@/components/form/translated-field-error';

type ITextFieldProps = FormFieldProps & {
  type?: string;
};

const TextField: FC<ITextFieldProps> = ({
  label,
  description,
  type = 'text',
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
      <Input
        id={field.name}
        name={field.name}
        type={type}
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

export default TextField;
