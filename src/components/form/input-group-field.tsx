import type { FC } from 'react';
import type { FormFieldProps } from '@/types/form';
import { Field, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { useFieldContext } from '@/hooks/use-form-context';
import TranslatedFieldError from '@/components/form/translated-field-error';

type ITextFieldProps = Omit<FormFieldProps, 'label'> & {
  type?: string;
  addons?: React.ReactNode;
  label?: string | React.ReactNode;
};

const InputGroupField: FC<ITextFieldProps> = ({
  label,
  type = 'text',
  mandatoryLabel = false,
  addons,
  placeholder,
}) => {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      {typeof label === 'string' ? (
        <FieldLabel htmlFor={field.name} mandatory={mandatoryLabel}>
          {label}
        </FieldLabel>
      ) : (
        label
      )}

      <InputGroup>
        <InputGroupInput
          id={field.name}
          name={field.name}
          onBlur={field.handleBlur}
          type={type}
          value={field.state.value}
          placeholder={placeholder}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
        />
        {addons}
      </InputGroup>
      {isInvalid && <TranslatedFieldError errors={field.state.meta.errors} />}
    </Field>
  );
};

export default InputGroupField;
