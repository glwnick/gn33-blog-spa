import { AlertCircleIcon } from 'lucide-react';
import type { ApiResponseError } from '@/lib/api-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import env from '@/config/env';

export const HeaderAlert = ({
  error,
  fullDetails = env.IS_DEVELOPMENT,
}: {
  error: ApiResponseError | null;
  fullDetails?: boolean;
}) => {
  return (
    <>
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>{error.message}</AlertTitle>

          {error.validationErrors && (
            <AlertDescription>
              <ul className="list-inside list-disc text-sm">
                {error.validationErrors.map((vError) => (
                  <li key={vError.field}>{vError.details}</li>
                ))}
              </ul>
            </AlertDescription>
          )}
        </Alert>
      )}
      {error && fullDetails && (
        <div className="text-xs text-destructive border">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      )}
    </>
  );
};
