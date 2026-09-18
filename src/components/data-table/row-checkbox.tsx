import { CheckSquare, Square } from 'lucide-react';
import type { FC } from 'react';

type RowCheckboxProps = {
  checked: boolean;
};

export const RowCheckbox: FC<RowCheckboxProps> = ({ checked }) => {
  return checked ? (
    <CheckSquare size="18" className="text-primary-strong" />
  ) : (
    <Square size="18" />
  );
};
