import type { SignInType } from '@/schemas/common';
import type { FC } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FieldLegend } from '@/components/ui/field';
import { ssoProviders } from '@/components/sign-in-type/sso-providers';
import { useTranslation } from '@/hooks/use-translation';

type ISSOSecurityProps = {
  type: SignInType;
};

export const SSOSecurity: FC<ISSOSecurityProps> = ({ type }) => {
  const { t } = useTranslation();
  const provider = ssoProviders.find((p) => p.id === type);
  return (
    <Card className="max-w-sm w-full break-inside-avoid mb-4">
      <CardHeader className="max-w-sm w-full">
        <FieldLegend>{t('securedBySSO')}</FieldLegend>
      </CardHeader>
      <CardContent className="max-w-sm w-full">
        {provider && (
          <div className="flex items-center gap-2 rounded-lg border p-2 w-fit">
            <span className="text-xl">{t(provider.name as any)}</span>
            <div className="size-6">{provider.icon}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
