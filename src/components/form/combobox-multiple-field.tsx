import type { FC } from 'react';
import type { FormFieldProps } from '@/types/form';
import type { SelectOptionItem } from '@/query-options/collection-options';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import { Skeleton } from '@/components/ui/skeleton';
import { useFieldContext } from '@/hooks/use-form-context';
import TranslatedFieldError from '@/components/form/translated-field-error';
import { useTranslation } from '@/hooks/use-translation';

type IComboboxMultipleFieldProps = {
  items: Array<SelectOptionItem> | undefined;
  placeholder?: string;
};

const ComboboxMultipleField: FC<
  IComboboxMultipleFieldProps & FormFieldProps
> = ({ label, items, placeholder, mandatoryLabel = false }) => {
  const field = useFieldContext<Array<string> | undefined>();
  const anchor = useComboboxAnchor();
  const { t } = useTranslation();

  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const selectedLabels = (field.state.value ?? []).reduce<
    Record<string, string>
  >((acc, val) => {
    const found = items?.find((item) => item.value === val);
    if (found) acc[val] = found.label;
    return acc;
  }, {});

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name} mandatory={mandatoryLabel}>
        {label}
      </FieldLabel>
      {items ? (
        <Combobox
          multiple
          value={field.state.value ?? []}
          onValueChange={(value) => field.handleChange(value)}
          items={items.map((item) => item.label)}
          autoHighlight
          id={field.name}
        >
          <ComboboxChips ref={anchor} onBlur={field.handleBlur}>
            <ComboboxValue>
              {(field.state.value ?? []).map((val) => (
                <ComboboxChip key={val}>
                  {selectedLabels[val] ?? val}
                </ComboboxChip>
              ))}
            </ComboboxValue>
            <ComboboxChipsInput
              placeholder={placeholder}
              aria-invalid={isInvalid}
            />
          </ComboboxChips>
          <ComboboxContent anchor={anchor}>
            <ComboboxEmpty>{t('noResults')}</ComboboxEmpty>
            <ComboboxList>
              {(itemLabel) => {
                const item = items.find((i) => i.label === itemLabel);
                return (
                  <ComboboxItem
                    key={item?.value ?? itemLabel}
                    value={item?.value ?? itemLabel}
                  >
                    {itemLabel}
                  </ComboboxItem>
                );
              }}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      ) : (
        <Skeleton className="h-8" />
      )}
      {isInvalid && <TranslatedFieldError errors={field.state.meta.errors} />}
    </Field>
  );
};

export default ComboboxMultipleField;
