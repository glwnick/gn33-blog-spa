import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { TwoFactorType } from '@/schemas/common';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TwoFactorTotp } from '@/components/two-factor/two-factor-totp';
import { TwFactorNone } from '@/components/two-factor/two-factor-none';
import { disableTwoFactorAuth, enableTwoFactorAuth } from '@/api/auth-api';
import { useTwoFactorTypesCollection } from '@/hooks/use-collections';
import { useTranslation } from '@/hooks/use-translation';
import { TwoFactorEmailOtp } from '@/components/two-factor/two-factor-email-otp';

type TwoFactorSelectorProps = {
  type: TwoFactorType;
};

const description = {
  NONE: 'noTwoFactorAuthDescription',
  OTP: 'otpDescription',
  TOTP: 'totpDescription',
} as const;

export const TwoFactorSelector = ({ type }: TwoFactorSelectorProps) => {
  const twoFactorTypes = useTwoFactorTypesCollection();
  const [acceptedType, setAcceptedType] = useState(type);
  const [selected, setSelected] = useState(type);
  const { t } = useTranslation();

  const {
    mutate: enableTwoFactorAuthMutation,
    isPending: enableTwoFactorAuthPending,
  } = useMutation({
    mutationFn: async (vars: { code: string; type: TwoFactorType }) =>
      await enableTwoFactorAuth(vars.code, vars.type),
    onSuccess: (_, vars) => {
      setAcceptedType(vars.type);
      toast.success('Two factor auth enabled successfully');
    },
  });

  const {
    mutate: disableTwoFactorAuthMutation,
    isPending: disableTwoFactorAuthPending,
  } = useMutation({
    mutationFn: disableTwoFactorAuth,
    onSuccess: () => {
      setAcceptedType('NONE');
      toast.success('Two factor auth disabled successfully');
    },
  });

  return (
    <Card className="max-w-sm w-full break-inside-avoid mb-4">
      <CardHeader className="max-w-sm  w-full">
        <FieldLegend>{t('twoFactorAuth')}</FieldLegend>
      </CardHeader>
      <CardContent className="grid grid-cols-1 max-w-sm  w-full">
        <Field>
          <FieldLabel htmlFor="twoFactorType">{t('selectType')}</FieldLabel>
          <Select
            items={twoFactorTypes ?? []}
            onValueChange={(value) => {
              setSelected(value as TwoFactorType);
            }}
            value={selected}
          >
            <SelectTrigger id="twoFactorType" autoFocus={false}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent autoFocus={false}>
              {twoFactorTypes?.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>{t(description[selected])}</FieldDescription>
        </Field>
      </CardContent>
      <CardFooter className="grid grid-cols-1 max-w-sm  w-full gap-2">
        {disableTwoFactorAuthPending ||
          (enableTwoFactorAuthPending && <Spinner className="size-12" />)}
        {selected === 'NONE' && (
          <TwFactorNone
            open={acceptedType !== 'NONE'}
            cancelAction={() => setSelected(acceptedType)}
            confirmAction={disableTwoFactorAuthMutation}
            twoFactorType={
              twoFactorTypes?.find((tf) => tf.value === selected)?.label
            }
          />
        )}
        {selected === 'OTP' && (
          <TwoFactorEmailOtp
            isEnabled={acceptedType === selected}
            enableTotp={(code) =>
              enableTwoFactorAuthMutation({ code, type: selected })
            }
          />
        )}
        {selected === 'TOTP' && (
          <TwoFactorTotp
            isEnabled={acceptedType === selected}
            enableTotp={(code) =>
              enableTwoFactorAuthMutation({ code, type: selected })
            }
          />
        )}
      </CardFooter>
    </Card>
  );
};
