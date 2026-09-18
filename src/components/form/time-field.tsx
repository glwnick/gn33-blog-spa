import { ClockIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import type { FormFieldProps } from '@/types/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Field, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import { useFieldContext } from '@/hooks/use-form-context';
import { useTranslation } from '@/hooks/use-translation';
import TranslatedFieldError from '@/components/form/translated-field-error';

const HOURS = Array.from({ length: 24 }, (_, index) =>
  index.toString().padStart(2, '0'),
);
const MINUTES = ['00', '15', '30', '45'] as const;

type TimeColumnProps = {
  items: ReadonlyArray<string>;
  selected: string;
  ariaLabel: string;
  onSelect: (value: string) => void;
};

const TimeColumn: FC<TimeColumnProps> = ({
  items,
  selected,
  ariaLabel,
  onSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const active = containerRef.current?.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: 'center' });
  }, []);
  return (
    <ScrollArea className="h-56 w-16">
      <div
        ref={containerRef}
        className="flex flex-col gap-0.5 p-1.5"
        role="listbox"
        aria-label={ariaLabel}
      >
        {items.map((item) => (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={item === selected ? 'default' : 'ghost'}
            data-active={item === selected}
            className="justify-center tabular-nums"
            onClick={() => onSelect(item)}
          >
            {item}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
};

type TimePickerProps = {
  value: string;
  isInvalid: boolean;
  onChange: (value: string) => void;
  id?: string;
};

/**
 * Quarter-hour time-of-day picker working in `HH:mm`. Shared by the standalone
 * TimeField (category C, time-only fields) and DateAndTimeField's time portion
 * (category A/D datetimes).
 */
export const TimePicker: FC<TimePickerProps> = ({
  value,
  isInvalid,
  onChange,
  id,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [hour = '00', minute = '00'] = value.split(':');
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            aria-invalid={isInvalid}
            className="w-28 justify-between font-normal tabular-nums"
          >
            <span className={cn(!value && 'text-muted-foreground')}>
              {value || t('selectTime')}
            </span>
            <ClockIcon className="opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="end">
        <div className="grid grid-cols-2 divide-x divide-border">
          <div className="bg-muted/30 px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
            {t('hours')}
          </div>
          <div className="bg-muted/30 px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
            {t('minutes')}
          </div>
          <TimeColumn
            items={HOURS}
            selected={hour}
            ariaLabel={t('hours')}
            onSelect={(selectedHour) => onChange(`${selectedHour}:${minute}`)}
          />
          <TimeColumn
            items={MINUTES}
            selected={minute}
            ariaLabel={t('minutes')}
            onSelect={(selectedMinute) => {
              onChange(`${hour}:${selectedMinute}`);
              setOpen(false);
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};

/**
 * Standalone time-of-day field (category C). Wire contract is `HH:mm:ss`
 * (matching backend `LocalTime` and `z.iso.time()`); the picker works in
 * `HH:mm` and the seconds are pinned to `:00`.
 */
const TimeField: FC<FormFieldProps> = ({ label, mandatoryLabel = false }) => {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const value = field.state.value.slice(0, 5);

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name} mandatory={mandatoryLabel}>
        {label}
      </FieldLabel>
      <TimePicker
        id={field.name}
        value={value}
        isInvalid={isInvalid}
        onChange={(next) => field.handleChange(`${next}:00`)}
      />
      {isInvalid && <TranslatedFieldError errors={field.state.meta.errors} />}
    </Field>
  );
};

export default TimeField;
