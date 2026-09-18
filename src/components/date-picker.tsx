import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import {
  formatDate,
  formatMonthShort,
  parseIsoDate,
  toIsoDate,
} from '@/lib/formatting';

type DatePickerProps = {
  readonly id?: string;
  /** Wire contract is `YYYY-MM-DD` (date-only, category C), matching the API convention. */
  readonly value: string | null;
  readonly onChange: (value: string | null) => void;
  readonly minDate?: Date;
  readonly maxDate?: Date;
  readonly invalid?: boolean;
  readonly className?: string;
};

/**
 * Standalone date-only picker (popover + calendar) for controlled, non-form usages. Form screens
 * keep using SingleDatePickerField, which wires this same UI into TanStack Form.
 */
export function DatePicker({
  id,
  value,
  onChange,
  minDate,
  maxDate,
  invalid = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const selected = parseIsoDate(value ?? '');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        render={
          <Button
            variant="outline"
            className={cn(
              'pl-3 text-left font-normal',
              !selected && 'text-muted-foreground',
              className,
            )}
            aria-invalid={invalid}
          >
            {selected ? formatDate(selected) : <span>{t('pickADate')}</span>}
            <CalendarIcon className="ml-auto opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-auto overflow-hidden p-0" align="end">
        <Calendar
          mode="single"
          selected={selected ?? undefined}
          onSelect={(date) => {
            onChange(date ? toIsoDate(date) : null);
            setOpen(false);
          }}
          disabled={(date) =>
            (maxDate !== undefined && date > maxDate) ||
            (minDate !== undefined && date < minDate)
          }
          defaultMonth={selected ?? undefined}
          captionLayout="dropdown"
          formatters={{
            formatMonthDropdown: formatMonthShort,
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
