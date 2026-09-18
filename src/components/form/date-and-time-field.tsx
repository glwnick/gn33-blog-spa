import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import type { FC } from 'react';
import type { FormFieldProps } from '@/types/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import { useFieldContext } from '@/hooks/use-form-context';
import { useTranslation } from '@/hooks/use-translation';
import TranslatedFieldError from '@/components/form/translated-field-error';
import { TimePicker } from '@/components/form/time-field';
import { formatDate, parseIsoLocalDateTime, toIsoDateTime } from '@/lib/formatting';

type DateTimeFieldProps = FormFieldProps & {
  showTime?: boolean;
};

const DateAndTimeField: FC<DateTimeFieldProps> = ({
  label,
  mandatoryLabel = false,
  showTime = true,
}) => {
  const field = useFieldContext<string | null>();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const { date, time } = parseIsoLocalDateTime(field.state.value ?? '');

  const handleDateSelect = (selected: Date | undefined) => {
    if (!selected) return;
    const currentTime = showTime ? time : '00:00';
    field.handleChange(toIsoDateTime(selected, currentTime));
    setOpen(false);
  };

  const handleTimeChange = (nextTime: string) => {
    const currentDate = date ?? new Date();
    field.handleChange(toIsoDateTime(currentDate, nextTime));
  };

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name} mandatory={mandatoryLabel}>
        {label}
      </FieldLabel>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                id={field.name}
                variant="outline"
                className={cn(
                  'flex-1 justify-start pl-3 text-left font-normal',
                  !date && 'text-muted-foreground',
                )}
                aria-invalid={isInvalid}
              />
            }
          >
            {date ? formatDate(date) : <span>{t('pickADate')}</span>}
            <CalendarIcon className="ml-auto opacity-50" />
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date ?? undefined}
              onSelect={handleDateSelect}
              defaultMonth={date ?? undefined}
              captionLayout="dropdown"
            />
          </PopoverContent>
        </Popover>
        {showTime && (
          <TimePicker
            value={time}
            isInvalid={isInvalid}
            onChange={handleTimeChange}
          />
        )}
      </div>
      {isInvalid && <TranslatedFieldError errors={field.state.meta.errors} />}
    </Field>
  );
};

export default DateAndTimeField;
