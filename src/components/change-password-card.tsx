import { ChangePasswordForm } from '@/components/change-password-form';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FieldLegend } from '@/components/ui/field';
import { useTranslation } from '@/hooks/use-translation';

export const ChangePasswordCard = () => {
  const { t } = useTranslation();
  return (
    <Card className="max-w-sm w-full break-inside-avoid mb-4">
      <CardHeader className="max-w-sm w-full">
        <FieldLegend>{t('changePassword')}</FieldLegend>
      </CardHeader>
      <CardContent className="grid grid-cols-1 max-w-sm w-full">
        <ChangePasswordForm />
      </CardContent>
    </Card>
  );
};
