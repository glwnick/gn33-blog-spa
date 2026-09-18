import { createFormHook } from '@tanstack/react-form';
import { lazy } from 'react';
import { fieldContext, formContext } from '@/hooks/use-form-context';

const TextField = lazy(() => import('@/components/form/text-field'));
const PhoneField = lazy(() => import('@/components/form/phone-field'));
const SingleDatePickerField = lazy(
  () => import('@/components/form/single-date-picker-field'),
);
const SelectField = lazy(() => import('@/components/form/select-field'));
const SubmitAndResetButtons = lazy(
  () => import('@/components/form/submit-and-reset-buttons'),
);
const PasswordField = lazy(() => import('@/components/form/password-field'));
const CheckboxField = lazy(() => import('@/components/form/checkbox-field'));
const TextareaField = lazy(() => import('@/components/form/textarea-field'));
const SingleFileField = lazy(
  () => import('@/components/form/single-file-field'),
);
const NumberField = lazy(() => import('@/components/form/number-field'));
const TextArrayField = lazy(() => import('@/components/form/text-array-field'));
const ComboboxMultipleField = lazy(
  () => import('@/components/form/combobox-multiple-field'),
);
const DateAndTimeField = lazy(
  () => import('@/components/form/date-and-time-field'),
);
const TimeField = lazy(() => import('@/components/form/time-field'));

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    TextField,
    PhoneField,
    SingleDatePickerField,
    SelectField,
    PasswordField,
    CheckboxField,
    TextareaField,
    SingleFileField,
    NumberField,
    TextArrayField,
    ComboboxMultipleField,
    DateAndTimeField,
    TimeField,
  },
  formComponents: {
    SubmitAndResetButtons,
  },
  fieldContext,
  formContext,
});
