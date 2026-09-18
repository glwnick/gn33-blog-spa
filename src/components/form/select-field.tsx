import type { FC } from 'react';
import type { FormFieldProps } from '@/types/form';
import type { SelectOptionItem } from '@/query-options/collection-options';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useFieldContext } from '@/hooks/use-form-context';
import TranslatedFieldError from '@/components/form/translated-field-error';

type ISelectFieldProps = {
  items: Array<SelectOptionItem> | undefined;
  defaultValue: string;
};

const SelectField: FC<ISelectFieldProps & FormFieldProps> = ({
  label,
  items,
  defaultValue,
  mandatoryLabel = false,
}) => {
  const field = useFieldContext<string | null>();
  // const localItems = typeof items === 'function' ? items() : items;

  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name} mandatory={mandatoryLabel}>
        {label}
      </FieldLabel>
      {items ? (
        <Select
          id={field.name}
          items={items}
          onValueChange={(value) => field.handleChange(value)}
          value={field.state.value || defaultValue}
        >
          <SelectTrigger onBlur={field.handleBlur} aria-invalid={isInvalid}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ) : (
        <Skeleton className="h-8" />
      )}
      {isInvalid && <TranslatedFieldError errors={field.state.meta.errors} />}
    </Field>
  );
};

export default SelectField;
