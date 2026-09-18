import { useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import type { FC } from 'react';
import { TwFactorBadge } from '@/components/two-factor/two-factor-badge';
import { TotpField } from '@/components/two-factor/totp-field';
import { Spinner } from '@/components/ui/spinner';
import { totpOptions } from '@/query-options/user-options';
import { useAuth } from '@/context/auth-provider';
import { MyQrCode } from '@/components/my-qr-code';
import { useTranslation } from '@/hooks/use-translation';

type TwoFactorTotpProps = {
  isEnabled: boolean;
  enableTotp: (code: string) => void;
};

export const TwoFactorTotp: FC<TwoFactorTotpProps> = ({
  isEnabled,
  enableTotp,
}) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: totpData, isLoading: totpLoading } = useQuery(
    totpOptions(user!.email, !isEnabled),
  );

  return isEnabled ? (
    <TwFactorBadge
      icon={<ShieldCheck className="size-12 text-primary-strong" />}
      title={t('totpEnabled')}
    />
  ) : (
    <div className="flex flex-col gap-4 items-center">
      {totpLoading ? (
        <Spinner className="size-12" />
      ) : (
        totpData && <MyQrCode data={totpData} />
      )}
      <TotpField onComplete={enableTotp} />
    </div>
  );
};
