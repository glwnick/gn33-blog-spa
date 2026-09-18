import { Fragment } from 'react';
import type { FC } from 'react';

import { ButtonGroup } from '@/components/ui/button-group';

interface IRowButtonsProps {
  buttons: Array<React.ReactNode>;
}

/**
 * Row action buttons, revealed on row hover/focus on pointer devices and
 * always visible on touch (hover does not exist there).
 */
export const RowButtons: FC<IRowButtonsProps> = ({ buttons }) => {
  return (
    <ButtonGroup >
      {buttons.map((button, index) => (
        <Fragment key={index}>{button}</Fragment>
      ))}
    </ButtonGroup>
  );
};
