import { Form } from 'lucide-react';
import { useMemo } from 'react';
import type { FC } from 'react';
import type { SignInType } from '@/schemas/common';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';
import { FacebookIcon, GoogleIcon } from '@/assets/svg/svgLogos';

type ISignInTypeProps = {
  type: SignInType;
};

const buildSignInTypeMap = (t: ReturnType<typeof useTranslation>['t']) => ({
  FORM_LOGIN: (
    <Badge variant="outline">
      {t('form')}
      <Form data-icon="inline-end" />
    </Badge>
  ),
  OAUTH2_GOOGLE: (
    <Badge variant="outline">
      {t('google')}
      <GoogleIcon />
    </Badge>
  ),
  OAUTH2_FACEBOOK: (
    <Badge variant="outline">
      {t('facebook')}
      <FacebookIcon />
    </Badge>
  ),
});

export const SignInTypeBadge: FC<ISignInTypeProps> = ({ type }) => {
  const { t } = useTranslation();
  return useMemo(() => buildSignInTypeMap(t)[type], [t, type]);
};
