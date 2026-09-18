import type { SignInType } from '@/schemas/common';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { FacebookIcon, GoogleIcon } from '@/assets/svg/svgLogos';
import { useTranslation } from '@/hooks/use-translation';
import API_ENDPOINTS from '@/config/api-endpoints';

type Provider = {
  id: SignInType;
  name: string;
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
};

export const ssoProviders: Array<Provider> = [
  {
    id: 'OAUTH2_GOOGLE',
    name: 'google',
    icon: <GoogleIcon />,
    tooltip: 'loginWithGoogle',
    onClick: () => {
      window.location.href = API_ENDPOINTS.sso.google;
    },
  },
  {
    id: 'OAUTH2_FACEBOOK',
    name: 'facebook',
    icon: <FacebookIcon />,
    tooltip: 'loginWithFacebook',
    onClick: () => {
      window.location.href = API_ENDPOINTS.sso.facebook;
    },
  },
] as const;

export const SSOProviders = () => {
  const { t } = useTranslation();
  return (
    <div className="grid gap-6 mt-6">
      <div className="select-none after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
        <span className="bg-card text-muted-foreground relative z-10 px-2 rounded-sm">
          {t('orContinueWith')}
        </span>
      </div>
      <div className="flex justify-center gap-4">
        {ssoProviders.map((provider) => (
          <Tooltip key={provider.name}>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  type="button"
                  className="w-1/4"
                  onClick={provider.onClick}
                >
                  {provider.icon}
                </Button>
              }
            />
            <TooltipContent side="bottom">
              <span>{t(provider.tooltip as any)}</span>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};
