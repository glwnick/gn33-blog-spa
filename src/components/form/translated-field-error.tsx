import type { FC } from 'react';

import { FieldError } from '@/components/ui/field';
import { useTranslation } from '@/hooks/use-translation';

type FieldErrorType = {
  message: string;
  minimum?: number;
};
interface ITranslatedFieldErrorsProps {
  errors: Array<FieldErrorType>;
}

const TranslatedFieldError: FC<ITranslatedFieldErrorsProps> = ({ errors }) => {
  const { t } = useTranslation();
  if (errors.length === 0) return null;

  return (
    <FieldError
      errors={errors.map((error) => {
        return {
          message: t(error.message as any, {
            ...error,
            defaultValue: error.message,
          }),
        };
      })}
    />
  );
};

export default TranslatedFieldError;
