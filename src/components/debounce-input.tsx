import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';

type DebouncedInputProps = {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
  startNode?: React.ReactNode;
  endNode?: React.ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'>;

export function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 1000,
  startNode,
  endNode,
  className,
  ...props
}: DebouncedInputProps) {
  const [value, setValue] = useState<string | number>(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <InputGroup className={className}>
      {startNode && (
        <InputGroupAddon align="inline-start">{startNode}</InputGroupAddon>
      )}
      <InputGroupInput
        {...props}
        value={value}
        onChange={(e) => {
          if (e.target.value === '') return setValue('');
          if (props.type === 'number') {
            setValue(e.target.valueAsNumber);
          } else {
            setValue(e.target.value);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onChange(value);
          }
        }}
        autoComplete="off"
      />
      {!value && endNode && (
        <InputGroupAddon align="inline-end">{endNode}</InputGroupAddon>
      )}
      {value && (
        <InputGroupAddon align="inline-end">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setValue('');
              onChange('');
            }}
          >
            <X />
          </Button>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
