import { ArrowLeft, CircleAlert } from 'lucide-react';
import { ButtonLink } from '@/components/button-link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Logo from '@/components/logo';
import { useTranslation } from '@/hooks/use-translation';

export const DefaultNotFound = () => {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Logo />
          <div className="flex flex-col items-center gap-2">
            <CircleAlert className="size-14" />
            <h1 className="text-4xl font-bold">404</h1>
          </div>
        </CardHeader>
        <CardContent className="text-center">
          <Separator className="mb-2" />
          <p className="text-lg font-bold">{t('404Title')}</p>
          <p className="mt-2 text-s">{t('404Message')}</p>
          <Separator className="mb-6 mt-4" />
          <ButtonLink variant="outline" to="/">
            <ArrowLeft />
            {t('goHome')}
          </ButtonLink>
        </CardContent>
      </Card>
    </div>
  );
};
