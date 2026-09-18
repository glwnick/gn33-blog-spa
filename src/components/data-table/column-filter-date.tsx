import { useTranslation } from 'react-i18next';
import { CalendarIcon, SearchIcon } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { formatDate, formatMonthShort, parseIsoDate, toIsoDate } from '@/lib/formatting';

type ColumnFilterDateProps = {
  filterValue: string;
  onDateChange: (selectedValue: string | null) => void;
};

export function ColumnFilterDate({
  filterValue,
  onDateChange,
}: ColumnFilterDateProps) {
  const { t } = useTranslation();
  const selectedDate = parseIsoDate(filterValue) ?? undefined;
  return (
    <div>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className={cn(
                'text-left font-normal w-full',
                !filterValue && 'text-muted-foreground',
              )}
            >
              <SearchIcon className="text-muted-foreground -ml-0.5" />
              {filterValue ? (
                formatDate(filterValue)
              ) : (
                <span>{t('pickADate')}</span>
              )}
              <CalendarIcon className="ml-auto opacity-50" />
            </Button>
          }
        />
        <PopoverContent className="w-auto overflow-hidden p-0" align="end">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => onDateChange(toIsoDate(date))}
            defaultMonth={selectedDate}
            captionLayout="dropdown"
            formatters={{
              formatMonthDropdown: formatMonthShort,
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
