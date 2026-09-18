import { useState } from 'react';
import { revalidateLogic } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MessageCircle, ShieldCheck } from 'lucide-react';
import type { FC } from 'react';
import type { WhatsAppStatus } from '@/schemas/notifications';
import { whatsappVerificationRequestSchema } from '@/schemas/notifications';
import {
  confirmWhatsAppVerification,
  optOutWhatsApp,
  requestWhatsAppVerification,
} from '@/api/notifications-api';
import {
  NOTIFICATION_PREFERENCES_KEY,
  WHATSAPP_STATUS_KEY,
  whatsappStatusOptions,
} from '@/query-options/notifications-options';
import { useAppForm } from '@/hooks/use-form';
import { useTranslation } from '@/hooks/use-translation';
import { formatDateTime } from '@/lib/formatting';
import { OtpField } from '@/components/two-factor/otp-field';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { FieldGroup, FieldSet } from '@/components/ui/field';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * OTP-verified WhatsApp opt-in: a member proves control of a number before it is ever used to notify them,
 * matching Meta's consent requirements. Once verified, NotificationPreferencesCard's WhatsApp toggle becomes
 * usable - the backend rejects that toggle until this card's status shows optedIn.
 */
export const WhatsAppVerificationCard: FC = () => {
  const { data } = useQuery(whatsappStatusOptions());

  if (data === undefined) return null;
  return <WhatsAppVerificationBody status={data} />;
};

type WhatsAppVerificationBodyProps = {
  readonly status: WhatsAppStatus;
};

function WhatsAppVerificationBody({ status }: WhatsAppVerificationBodyProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [codeSent, setCodeSent] = useState(false);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: [WHATSAPP_STATUS_KEY] });
    queryClient.invalidateQueries({
      queryKey: [NOTIFICATION_PREFERENCES_KEY],
    });
  };

  const { mutate: requestCode, isPending: isSending } = useMutation({
    mutationFn: requestWhatsAppVerification,
    onSuccess: () => {
      setCodeSent(true);
      toast.success(t('whatsappVerificationSent'));
    },
    onError: (error) => toast.error(error.message),
  });

  const { mutate: confirmCode, isPending: isConfirming } = useMutation({
    mutationFn: confirmWhatsAppVerification,
    onSuccess: () => {
      setCodeSent(false);
      toast.success(t('whatsappVerifySuccess'));
      invalidateAll();
    },
    onError: (error) => toast.error(error.message),
  });

  const { mutate: optOut, isPending: isOptingOut } = useMutation({
    mutationFn: optOutWhatsApp,
    onSuccess: () => {
      toast.success(t('whatsappOptOutSuccess'));
      invalidateAll();
    },
    onError: (error) => toast.error(error.message),
  });

  const form = useAppForm({
    defaultValues: { whatsappNumber: '' },
    validators: { onDynamic: whatsappVerificationRequestSchema },
    validationLogic: revalidateLogic(),
    onSubmit: ({ value }) => requestCode(value.whatsappNumber),
  });

  return (
    <Card className="max-w-sm h-fit w-full break-inside-avoid mb-4">
      <CardHeader>
        <CardTitle>
          <MessageCircle className="mr-2 inline" size="20" />
          {t('whatsapp')}
        </CardTitle>
        <CardDescription>{t('whatsappHint')}</CardDescription>
      </CardHeader>
      <CardContent>
        {status.optedIn ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-primary-strong" size={20} />
              <div>
                <p className="font-medium">{status.maskedNumber}</p>
                {status.verifiedAt && (
                  <p className="text-muted-foreground text-sm">
                    {t('whatsappVerifiedSince', {
                      date: formatDateTime(status.verifiedAt),
                    })}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              disabled={isOptingOut}
              onClick={() => optOut()}
            >
              {t('removeWhatsappNumber')}
              {isOptingOut && <Spinner />}
            </Button>
          </div>
        ) : codeSent ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground text-sm">
              {t('whatsappVerificationCodeHint')}
            </p>
            <OtpField onComplete={(code) => confirmCode(code)} />
            {isConfirming && <Spinner />}
          </div>
        ) : (
          <FieldSet>
            <FieldGroup>
              <form.AppField
                name="whatsappNumber"
                children={(field) => (
                  <field.PhoneField
                    label={t('whatsappNumber')}
                    mandatoryLabel
                  />
                )}
              />
            </FieldGroup>
            <Button disabled={isSending} onClick={() => form.handleSubmit()}>
              {t('sendVerificationCode')}
              {isSending && <Spinner />}
            </Button>
          </FieldSet>
        )}
      </CardContent>
    </Card>
  );
}
