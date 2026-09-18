import { useMutation } from '@tanstack/react-query';
import { Send, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { FC } from 'react';
import { TwFactorBadge } from '@/components/two-factor/two-factor-badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from '@/hooks/use-translation';
import { otpLogin } from '@/api/auth-api';
import { OtpField } from '@/components/two-factor/otp-field';

type TwoFactorEmailOtpProps = {
  isEnabled: boolean;
  enableTotp: (code: string) => void;
};

export const TwoFactorEmailOtp: FC<TwoFactorEmailOtpProps> = ({
  isEnabled,
  enableTotp,
}) => {
  const { t } = useTranslation();

  const {
    mutate: otpMutate,
    isPending,
    isSuccess,
  } = useMutation({
    mutationFn: otpLogin,
    onSuccess: (data) => {
      toast.success(data.message);
    },
  });

  return isEnabled ? (
    <TwFactorBadge
      icon={<ShieldCheck className="size-12 text-primary-strong" />}
      title={t('emailOtpEnabled')}
    />
  ) : (
    <>
      <div className="flex flex-col justify-center items-center gap-4">
        <Button
          variant="default"
          onClick={() => otpMutate()}
          disabled={isPending || isSuccess}
        >
          {t('sendOtpEmail')}

          {isPending ? <Spinner /> : <Send />}
        </Button>
        {isSuccess && <OtpField onComplete={enableTotp} />}
      </div>
    </>
  );
};
