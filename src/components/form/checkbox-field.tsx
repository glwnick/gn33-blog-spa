import type { FC } from 'react';
import type { FormFieldProps } from '@/types/form';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';
import { useFieldContext } from '@/hooks/use-form-context';
import TranslatedFieldError from '@/components/form/translated-field-error';

type ICheckboxFieldProps = FormFieldProps & {
  children?: React.ReactNode;
};
const CheckboxField: FC<ICheckboxFieldProps> = ({
  label,
  description,
  mandatoryLabel = false,
  children,
}) => {
  const field = useFieldContext<boolean>();

  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field orientation="horizontal" data-invalid={isInvalid}>
      <Checkbox
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        checked={field.state.value}
        onCheckedChange={field.handleChange}
        aria-invalid={isInvalid}
      />
      <FieldContent>
        <FieldLabel htmlFor={field.name} mandatory={mandatoryLabel}>
          {label}
        </FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
        {children}
        {isInvalid && <TranslatedFieldError errors={field.state.meta.errors} />}
      </FieldContent>
    </Field>
  );
};

export default CheckboxField;
