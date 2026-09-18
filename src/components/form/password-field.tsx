import { useState } from 'react';
import { EyeIcon, EyeOffIcon, InfoIcon } from 'lucide-react';
import type { FC } from 'react';
import type { FormFieldProps } from '@/types/form';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTrigger,
} from '@/components/ui/popover';
import TranslatedFieldError from '@/components/form/translated-field-error';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFieldContext } from '@/hooks/use-form-context';
import { useTranslation } from '@/hooks/use-translation';
import { useIsMobile } from '@/hooks/use-mobile';

const PasswordField: FC<FormFieldProps> = ({
  label,
  mandatoryLabel = false,
}) => {
  const field = useFieldContext<string>();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const isMobile = useIsMobile();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name} mandatory={mandatoryLabel}>
        {label}
      </FieldLabel>

      <InputGroup>
        <InputGroupInput
          id={field.name}
          name={field.name}
          onBlur={field.handleBlur}
          type={showPassword ? 'text' : 'password'}
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
        />
        <InputGroupAddon align="inline-end">
          {isMobile ? (
            <Popover>
              <PopoverTrigger
                render={
                  <InputGroupButton size="icon-xs" tabIndex={-1}>
                    <InfoIcon />
                  </InputGroupButton>
                }
              />
              <PopoverContent align="start">
                <PopoverHeader>
                  <PopoverDescription>{t('passwordInfo')}</PopoverDescription>
                </PopoverHeader>
              </PopoverContent>
            </Popover>
          ) : (
            <Tooltip>
              <TooltipTrigger render={<InfoIcon className="select-none" />} />
              <TooltipContent
                side="bottom"
                className="max-w-64 py-3 text-pretty"
              >
                <p>{t('passwordInfo')}</p>
              </TooltipContent>
            </Tooltip>
          )}
          <InputGroupButton
            size="icon-xs"
            tabIndex={-1}
            onClick={() => {
              setShowPassword((prev) => !prev);
            }}
          >
            {showPassword ? <EyeIcon /> : <EyeOffIcon />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {isInvalid && <TranslatedFieldError errors={field.state.meta.errors} />}
    </Field>
  );
};

export default PasswordField;
