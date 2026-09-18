import type { FC } from 'react';
import type { FormFieldProps } from '@/types/form';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { useFieldContext } from '@/hooks/use-form-context';
import TranslatedFieldError from '@/components/form/translated-field-error';
import {
  NumberField as BaseNumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field';

const NumberField: FC<
  FormFieldProps & { format?: Intl.NumberFormatOptions; suffix?: string }
> = ({
  label,
  description,
  mandatoryLabel = false,
  placeholder,
  format,
  suffix,
}) => {
  const field = useFieldContext<number>();

  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name} mandatory={mandatoryLabel}>
        {label}
      </FieldLabel>

      <BaseNumberField
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value ?? 0)}
        format={format}
      >
        <NumberFieldGroup>
          <NumberFieldDecrement />
          <NumberFieldInput
            id={field.name}
            name={field.name}
            placeholder={placeholder}
            onBlur={field.handleBlur}
            aria-invalid={isInvalid}
          />
          {suffix && (
            <span className="flex shrink-0 select-none items-center pr-2 text-sm text-muted-foreground">
              {suffix}
            </span>
          )}
          <NumberFieldIncrement />
        </NumberFieldGroup>
      </BaseNumberField>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <TranslatedFieldError errors={field.state.meta.errors} />}
    </Field>
  );
};

export default NumberField;
