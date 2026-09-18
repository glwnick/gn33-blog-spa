import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from '@/hooks/use-translation';

export const RESEND_PIN_COOLDOWN_SECONDS = 30;

const secondsLeft = (resendAvailableAt: number) =>
  Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000));

type ResendPinButtonProps = {
  readonly resendAvailableAt: number;
  readonly pending: boolean;
  readonly onResend: () => void;
};

// Ticks down from RESEND_PIN_COOLDOWN_SECONDS (reset by the caller each time a
// PIN is sent) and only allows a resend once the cooldown reaches zero.
export const ResendPinButton = ({
  resendAvailableAt,
  pending,
  onResend,
}: ResendPinButtonProps) => {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(() =>
    secondsLeft(resendAvailableAt),
  );

  useEffect(() => {
    setRemaining(secondsLeft(resendAvailableAt));
    const interval = setInterval(() => {
      setRemaining(secondsLeft(resendAvailableAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendAvailableAt]);

  const disabled = pending || remaining > 0;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled}
      onClick={onResend}
    >
      {pending ? (
        <Spinner />
      ) : remaining > 0 ? (
        t('resendCodeIn', { seconds: remaining })
      ) : (
        t('resendCode')
      )}
    </Button>
  );
};
