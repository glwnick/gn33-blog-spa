import { Search } from 'lucide-react';
import type { SelectOptionContentItem } from '@/query-options/collection-options';
import { useTranslation } from '@/hooks/use-translation';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ColumnFilterSelectProps = {
  filterOptions: Array<SelectOptionContentItem>;
  filterValue: string | null;
  onSelectChange: (selectedValue: string | null) => void;
};

export function ColumnFilterSelect({
  filterOptions,
  filterValue,
  onSelectChange,
}: ColumnFilterSelectProps) {
  const { t } = useTranslation();
  const selectedOption = filterOptions.find(
    (item) => item.value === filterValue,
  );
  return (
    <Select
      items={filterOptions}
      onValueChange={onSelectChange}
      value={filterValue ?? null}
    >
      <SelectTrigger className="w-full">
        <SelectValue>
          {selectedOption?.content?.() ?? selectedOption?.label ?? (
            <span className="text-muted-foreground flex items-center gap-1">
              <Search />
              {t('select')}...
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="">
            <span className="pl-1.5 text-muted-foreground">{t('cancel')}</span>
          </SelectItem>
          {filterOptions.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.content?.() ?? item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
