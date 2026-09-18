import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiResponseError } from '@/lib/api-error';
import { TOAST_DURATION } from '@/config/query';

function defaultErrorHandler(error: Error): void {
  if (error instanceof ApiResponseError) {
    toast.error(error.message, {
      description: error.validationErrors?.map((e) => e.message).join(', '),
      duration: TOAST_DURATION,
    });
  } else {
    toast.error('An unexpected error occurred');
  }
}

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: { skipGlobalErrorToast?: boolean };
    mutationMeta: { skipGlobalErrorToast?: boolean };
  }
}

/**
 * A factory rather than a module singleton, for the same reason `getRouter()` is one: under SSR a
 * single Node process serves many concurrent visitors, and one shared cache would serve one
 * visitor's query data to the next. `getRouter()` calls this once per request.
 */
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (
            error instanceof ApiResponseError &&
            error.status >= 400 &&
            error.status < 500
          ) {
            return false;
          }
          return failureCount < 2;
        },
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (query.meta?.skipGlobalErrorToast) return;
        defaultErrorHandler(error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.meta?.skipGlobalErrorToast) return;
        defaultErrorHandler(error);
      },
    }),
  });
