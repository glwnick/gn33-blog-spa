import { revalidateLogic } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { UserDetailsResponse } from '@/schemas/users';
import type { CheckoutAddress } from '@/schemas/checkout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FieldGroup, FieldSet } from '@/components/ui/field';
import { HeaderAlert } from '@/components/header-alert';
import { checkoutAddressSchema, emptyCheckoutAddress } from '@/schemas/checkout';
import { deleteAddress, saveAddress } from '@/api/user-api';
import { useAppForm } from '@/hooks/use-form';
import { useTranslation } from '@/hooks/use-translation';
import { profileOptions } from '@/query-options/user-details';
import { useAlertMutation } from '@/hooks/use-alert-mutation';

type IProfileAddressCardProps = {
  values: UserDetailsResponse;
};

/** Phase 5's saved address (see backend UserEntity), reused as the checkout prefill - same field shape and
 * validation as the checkout form's own address block, so the two never drift apart. */
export const ProfileAddressCard = ({ values }: IProfileAddressCardProps) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const {
    mutate: saveAddressMutation,
    alertError,
    clearAlertError,
  } = useAlertMutation({
    mutationFn: (address: CheckoutAddress) => saveAddress(values.userId, address),
    onSuccess: async () => {
      await queryClient.invalidateQueries(profileOptions(values.userId));
      toast.success(t('varUpdatedSuccessfully', { var: t('profileAddressTitle') }));
    },
  });

  const { mutate: deleteAddressMutation, isPending: isDeleting } = useAlertMutation({
    mutationFn: () => deleteAddress(values.userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries(profileOptions(values.userId));
      toast.success(t('varDeletedSuccessfully', { var: t('profileAddressTitle') }));
    },
  });

  const addressForm = useAppForm({
    defaultValues: values.savedAddress ?? emptyCheckoutAddress,
    validators: { onDynamic: checkoutAddressSchema },
    validationLogic: revalidateLogic(),
    onSubmit: (subData) => {
      saveAddressMutation(subData.value);
      clearAlertError();
    },
  });

  return (
    <Card className="h-fit w-full">
      <FieldSet>
        <CardHeader>
          <CardTitle>{t('profileAddressTitle')}</CardTitle>
          <CardDescription>{t('profileAddressHint')}</CardDescription>
          <HeaderAlert error={alertError} />
        </CardHeader>
        <CardContent>
          <FieldGroup className="max-w-xl">
            <addressForm.AppField
              name="fullName"
              children={(field) => (
                <field.TextField label={t('checkoutFullName')} mandatoryLabel />
              )}
            />
            <addressForm.AppField
              name="phone"
              children={(field) => (
                <field.PhoneField label={t('checkoutPhone')} mandatoryLabel />
              )}
            />
            <addressForm.AppField
              name="street"
              children={(field) => (
                <field.TextField label={t('checkoutStreetAndNumber')} mandatoryLabel />
              )}
            />
            <addressForm.AppField
              name="city"
              children={(field) => (
                <field.TextField label={t('checkoutCity')} mandatoryLabel />
              )}
            />
            <addressForm.AppField
              name="postalCode"
              children={(field) => (
                <field.TextField label={t('checkoutPostalCode')} mandatoryLabel />
              )}
            />
            <addressForm.AppField
              name="companyName"
              children={(field) => <field.TextField label={t('checkoutCompanyName')} />}
            />
            <addressForm.AppField
              name="companyCui"
              children={(field) => <field.TextField label={t('checkoutCompanyCui')} />}
            />
            <addressForm.AppForm
              children={
                <addressForm.SubmitAndResetButtons
                  submitLabel={t('save')}
                  resetLabel={t('cancel')}
                />
              }
            />
            {values.savedAddress && (
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={() => deleteAddressMutation()}
              >
                {t('profileAddressRemove')}
              </Button>
            )}
          </FieldGroup>
        </CardContent>
      </FieldSet>
    </Card>
  );
};
