import { ListPlus, Minus } from 'lucide-react';
import type { FC } from 'react';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFieldContext } from '@/hooks/use-form-context';

type TextArrayFieldProps = {
  label: string;
  addButtonLabel?: string;
};

const TextArrayField: FC<TextArrayFieldProps> = ({ label, addButtonLabel }) => {
  const field = useFieldContext<Array<string>>();

  const handleChange = (index: number, value: string): void => {
    const updated = field.state.value.map((item, i) =>
      i === index ? value : item,
    );
    field.handleChange(updated);
  };

  const handleRemove = (index: number): void => {
    const updated = field.state.value.filter((_, i) => i !== index);
    field.handleChange(updated);
  };

  const handleAdd = (): void => {
    field.handleChange([...field.state.value, '']);
  };

  return (
    <FieldGroup>
      <FieldLabel>{label}</FieldLabel>
      {field.state.value.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <Button onClick={() => handleRemove(i)} variant="ghost" type="button">
            <Minus />
          </Button>
          <Input
            value={item}
            onBlur={field.handleBlur}
            onChange={(e) => handleChange(i, e.target.value)}
          />
        </div>
      ))}
      <Button onClick={handleAdd} variant="ghost" type="button">
        <ListPlus /> {addButtonLabel}
      </Button>
    </FieldGroup>
  );
};

export default TextArrayField;
