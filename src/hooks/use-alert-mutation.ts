// src/hooks/use-form-mutation.ts
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import type { UseMutationOptions } from '@tanstack/react-query';
import type { ApiResponseError } from '@/lib/api-error';

type UseFormMutationOptions<TData, TVariables> = Omit<
  UseMutationOptions<TData, ApiResponseError, TVariables>,
  'onError'
> & {
  onError?: (error: ApiResponseError) => void;
};

export const useAlertMutation = <TData = unknown, TVariables = void>(
  options: UseFormMutationOptions<TData, TVariables>,
) => {
  const [alertError, setAlertError] = useState<ApiResponseError | null>(null);

  const mutation = useMutation<TData, ApiResponseError, TVariables>({
    ...options,
    onError: (error) => {
      setAlertError(error);
      options.onError?.(error);
    },
  });

  const clearAlertError = () => setAlertError(null);

  return { ...mutation, alertError, clearAlertError };
};
