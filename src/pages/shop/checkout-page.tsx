import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { revalidateLogic } from '@tanstack/react-form';
import type { CheckoutRequest } from '@/schemas/checkout';
import type { TranslationKey } from '@/hooks/use-translation';
import { AppContent } from '@/components/layout/app-content';
import { Button, buttonVariants } from '@/components/ui/button';
import { ButtonNavLink } from '@/components/ui/button-nav-link';
import { Card, CardContent } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { FieldGroup, FieldSeparator, FieldSet } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { HeaderAlert } from '@/components/header-alert';
import { useAlertMutation } from '@/hooks/use-alert-mutation';
import { useAppForm } from '@/hooks/use-form';
import { useAuth } from '@/context/auth-provider';
import { useCart } from '@/context/cart-provider';
import { useTranslation } from '@/hooks/use-translation';
import { checkout } from '@/api/checkout-api';
import { storefrontConfigOptions } from '@/query-options/checkout-options';
import { profileOptions } from '@/query-options/user-details';
import { toCheckoutLines } from '@/lib/checkout-mapping';
import { checkoutFormSchema, defaultCheckoutFormValues } from '@/schemas/checkout';
import { formatPrice, roundToCents } from '@/lib/formatting';
import { productImageSrc } from '@/lib/product-image-src';
import { validateFormFields } from '@/lib/validate-form-fields';
import { cn } from '@/lib/utils';

/**
 * The handoff's step indicator is "1 Delivery > 2 Payment > 3 Review". Payment is not a step of this form:
 * an order lands in `PENDING_PAYMENT` and is settled outside the SPA until ROADMAP.md's Phase 3 decision is
 * made, so rendering it here would be a step that never becomes current - the same dead affordance the
 * catalogue card's stubs are careful not to be. The two steps below are the two that really exist.
 */
const CHECKOUT_STEPS = [
  { id: 'delivery', labelKey: 'checkoutStepDelivery' },
  { id: 'review', labelKey: 'checkoutStepReview' },
] as const satisfies ReadonlyArray<{ id: string; labelKey: TranslationKey }>;

type CheckoutStep = (typeof CHECKOUT_STEPS)[number]['id'];

function CheckoutStepIndicator({ current }: { readonly current: CheckoutStep }) {
  const { t } = useTranslation();
  const currentIndex = CHECKOUT_STEPS.findIndex((step) => step.id === current);

  return (
    <ol className="mb-4 flex flex-wrap items-center gap-2 text-[13px]">
      {CHECKOUT_STEPS.map((step, index) => (
        <li key={step.id} className="flex items-center gap-2">
          {index > 0 && <span className="text-muted-foreground">›</span>}
          <span
            aria-current={index === currentIndex ? 'step' : undefined}
            className={cn(
              index <= currentIndex ? 'font-medium text-foreground' : 'text-muted-foreground',
            )}
          >
            {index + 1} {t(step.labelKey)}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user, isInitializing } = useAuth();
  const [step, setStep] = useState<CheckoutStep>('delivery');

  const hasPersonalisedLine = items.some((item) => item.madeToOrder || item.oneOfAKind);

  const {
    data: storefrontConfig,
    isError: storefrontConfigFailed,
    refetch: retryStorefrontConfig,
  } = useQuery(storefrontConfigOptions());

  // The profile read that carries the saved address (Phase 5) - only meaningful once `user` resolves, so it
  // stays disabled for a guest and its own pending state joins `isInitializing` below, the same gate the
  // email/fullName prefill already leans on to keep the form's defaultValues correct before first mount.
  const { data: profile, isPending: isProfilePending } = useQuery({
    ...profileOptions(user?.userId ?? ''),
    enabled: !!user,
  });
  const shippingCost = storefrontConfig
    ? storefrontConfig.freeShippingThreshold !== null &&
      subtotal >= storefrontConfig.freeShippingThreshold
      ? 0
      : storefrontConfig.flatRate
    : undefined;
  const total = shippingCost === undefined ? undefined : roundToCents(subtotal + shippingCost);

  const {
    mutateAsync: submitCheckout,
    isPending: isSubmitting,
    alertError,
  } = useAlertMutation({
    mutationFn: checkout,
    onSuccess: (order) => {
      clearCart();
      navigate({ to: '/order-confirmation/$orderId', params: { orderId: order.orderId } });
    },
  });

  const defaultValues = useMemo(() => {
    if (!user) {
      return defaultCheckoutFormValues;
    }
    const savedAddress = profile?.savedAddress;
    return {
      ...defaultCheckoutFormValues,
      email: user.email,
      address: savedAddress
        ? { ...defaultCheckoutFormValues.address, ...savedAddress }
        : { ...defaultCheckoutFormValues.address, fullName: user.fullName },
      // Default to saving when there's nothing saved yet (nudges a first-time saver); default to not
      // re-saving when the form is already prefilled from one, so editing it here for a one-off delivery
      // doesn't silently overwrite the profile's address.
      saveAddress: !savedAddress,
    };
  }, [user, profile]);

  const form = useAppForm({
    defaultValues,
    validators: { onDynamic: checkoutFormSchema },
    validationLogic: revalidateLogic(),
    onSubmit: ({ value }) => {
      const payload: CheckoutRequest = {
        email: value.email,
        lines: toCheckoutLines(items, value.personalisationAcknowledged),
        address: value.address,
        termsAccepted: value.termsAccepted,
        returnsPolicyAccepted: value.returnsPolicyAccepted,
        createAccount: !user && value.createAccount,
        firstName: value.firstName,
        lastName: value.lastName,
        password: value.password,
        saveAddress: value.saveAddress,
      };
      return submitCheckout(payload);
    },
  });

  /**
   * Which fields step 1 owns. The account trio is only part of it when the guest asked for an account, so a
   * shopper who left the box unticked is not blocked by a password field they never saw.
   */
  const deliveryStepFields = (createAccount: boolean): ReadonlyArray<string> => [
    ...(user ? [] : ['email']),
    'address.fullName',
    'address.phone',
    'address.street',
    'address.city',
    'address.postalCode',
    ...(!user && createAccount ? ['firstName', 'lastName', 'password'] : []),
  ];

  const goToReview = async () => {
    const valid = await validateFormFields(
      form,
      deliveryStepFields(form.state.values.createAccount),
    );
    if (valid) {
      setStep('review');
    }
  };

  if (items.length === 0) {
    return (
      <AppContent title={t('checkout')}>
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('shopCartEmptyTitle')}</EmptyTitle>
            <EmptyDescription>{t('shopCartEmptyDescription')}</EmptyDescription>
          </EmptyHeader>
          <ButtonNavLink to="/shop" className={buttonVariants({ variant: 'default' })}>
            {t('shopBrowseCatalogue')}
          </ButtonNavLink>
        </Empty>
      </AppContent>
    );
  }

  return (
    <AppContent
      title={t('checkout')}
      isPending={isInitializing || (!!user && isProfilePending)}
      fallback={<CheckoutPageSkeleton />}
    >
      <HeaderAlert error={alertError} />
      <CheckoutStepIndicator current={step} />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          // Step 1 owns the address fields, and its card is hidden while the review step is showing, so a
          // schema failure there would otherwise be an invisible one: the submit does nothing and the field
          // explaining why is off screen. Send the shopper back to the step that can show the error.
          const deliveryValid = await validateFormFields(
            form,
            deliveryStepFields(form.state.values.createAccount),
          );
          if (!deliveryValid) {
            setStep('delivery');
            return;
          }
          form.handleSubmit();
        }}
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          <Card className={cn(step === 'delivery' ? undefined : 'hidden')}>
            <CardContent className="flex flex-col gap-6">
            <FieldGroup>
              <FieldSet>
                {user ? (
                  // Signed-in shoppers can't redirect confirmation to another address here - the order
                  // always attaches to the authenticated account (OrderServiceImpl.resolveIdentity never
                  // reads the request's email for that path), so showing an editable field would be
                  // misleading about what actually happens on submit.
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{t('checkoutEmail')}</span>
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  </div>
                ) : (
                  <form.AppField
                    name="email"
                    children={(field) => (
                      <field.TextField label={t('checkoutEmail')} type="email" mandatoryLabel />
                    )}
                  />
                )}
              </FieldSet>

              <FieldSeparator />

              <FieldSet>
                {/* The handoff's `grid-cols-2 gap-3` address block, one column below `sm` where two
                    side-by-side fields are each too narrow to read their own value back. */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <form.AppField
                    name="address.fullName"
                    children={(field) => (
                      <field.TextField label={t('checkoutFullName')} mandatoryLabel />
                    )}
                  />
                  <form.AppField
                    name="address.phone"
                    children={(field) => (
                      <field.PhoneField label={t('checkoutPhone')} mandatoryLabel />
                    )}
                  />
                </div>
                <form.AppField
                  name="address.street"
                  children={(field) => (
                    <field.TextField label={t('checkoutStreetAndNumber')} mandatoryLabel />
                  )}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <form.AppField
                    name="address.city"
                    children={(field) => (
                      <field.TextField label={t('checkoutCity')} mandatoryLabel />
                    )}
                  />
                  <form.AppField
                    name="address.postalCode"
                    children={(field) => (
                      <field.TextField label={t('checkoutPostalCode')} mandatoryLabel />
                    )}
                  />
                </div>
                <form.AppField
                  name="address.companyName"
                  children={(field) => <field.TextField label={t('checkoutCompanyName')} />}
                />
                <form.AppField
                  name="address.companyCui"
                  children={(field) => <field.TextField label={t('checkoutCompanyCui')} />}
                />
                {user && (
                  <form.AppField
                    name="saveAddress"
                    children={(field) => (
                      <field.CheckboxField label={t('checkoutSaveAddress')} />
                    )}
                  />
                )}
              </FieldSet>

              {!user && (
                <>
                  <FieldSeparator />
                  <FieldSet>
                    <form.AppField
                      name="createAccount"
                      children={(field) => (
                        <field.CheckboxField label={t('checkoutCreateAccount')} />
                      )}
                    />
                    <form.Subscribe
                      selector={(state) => state.values.createAccount}
                      children={(createAccount) =>
                        createAccount && (
                          <>
                            <form.AppField
                              name="firstName"
                              children={(field) => (
                                <field.TextField label={t('firstName')} mandatoryLabel />
                              )}
                            />
                            <form.AppField
                              name="lastName"
                              children={(field) => (
                                <field.TextField label={t('lastName')} mandatoryLabel />
                              )}
                            />
                            <form.AppField
                              name="password"
                              children={(field) => (
                                <field.PasswordField label={t('password')} mandatoryLabel />
                              )}
                            />
                            <form.AppField
                              name="saveAddress"
                              children={(field) => (
                                <field.CheckboxField label={t('checkoutSaveAddress')} />
                              )}
                            />
                          </>
                        )
                      }
                    />
                  </FieldSet>
                </>
              )}
            </FieldGroup>
            </CardContent>
          </Card>

          {/* The review step's read-only echo of step 1, with the handoff's "Change" affordance. It edits the
              already-prefilled form in place rather than opening a saved-address picker: Phase 5's saved
              address (plans/PLAN-shop-surfaces.md slice 3, conflict 3) is now just the checkout prefill, not
              a book of several to choose between - see UserEntity's javadoc on the backend. */}
          {step === 'review' && (
            <Card className="h-fit">
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-medium">{t('myOrdersDeliveringTo')}</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setStep('delivery')}
                  >
                    {t('checkoutChangeAddress')}
                  </Button>
                </div>
                <form.Subscribe
                  selector={(state) => state.values.address}
                  children={(address) => (
                    <div className="text-sm text-muted-foreground">
                      <p className="text-foreground">{address.fullName}</p>
                      <p>{address.street}</p>
                      <p>
                        {address.city}, {address.postalCode}
                      </p>
                      <p>{address.phone}</p>
                    </div>
                  )}
                />
              </CardContent>
            </Card>
          )}

          <Card className="h-fit lg:sticky lg:top-20">
            <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <div key={item.variantId} className="flex items-center gap-3 text-sm">
                  {/* The handoff's 44px summary thumb - the same picture the shopper picked in the catalogue,
                      so the review step is recognisably about the right pieces. */}
                  <div className="size-11 shrink-0 overflow-hidden rounded-md bg-muted">
                    {item.imageUrl && (
                      <img
                        src={productImageSrc(item.imageUrl)}
                        alt={item.imageAltText ?? ''}
                        className="size-full object-cover"
                      />
                    )}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    {item.productName}
                    {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                  </span>
                  <span>{formatPrice(roundToCents(item.unitPrice * item.quantity))}</span>
                </div>
              ))}
            </div>

            <FieldSeparator />

            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('checkoutSubtotal')}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('checkoutShipping')}</span>
                <span>{shippingCost === undefined ? '…' : formatPrice(shippingCost)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>{t('checkoutTotal')}</span>
                <span>{total === undefined ? '…' : formatPrice(total)}</span>
              </div>
            </div>

            {/* The consents belong to the review step: they are what the shopper is agreeing to having read
                the final total, and showing them next to a half-filled address form invites ticking first and
                reading never. */}
            {step === 'review' && (
              <>
                <FieldSeparator />

                <FieldSet>
                  <form.AppField
                    name="termsAccepted"
                    children={(field) => (
                      <field.CheckboxField
                        label={t('checkoutTermsAcceptance')}
                        mandatoryLabel
                      />
                    )}
                  />
                  <form.AppField
                    name="returnsPolicyAccepted"
                    children={(field) => (
                      <field.CheckboxField
                        label={t('checkoutReturnsAcceptance')}
                        mandatoryLabel
                      />
                    )}
                  />
                  {hasPersonalisedLine && (
                    <form.AppField
                      name="personalisationAcknowledged"
                      children={(field) => (
                        <field.CheckboxField
                          label={t('checkoutPersonalisationAcknowledgment')}
                          mandatoryLabel
                        />
                      )}
                    />
                  )}
                </FieldSet>
              </>
            )}

            {storefrontConfigFailed && (
              <div className="flex flex-col gap-2 text-sm text-destructive">
                <span>{t('checkoutShippingConfigError')}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => retryStorefrontConfig()}>
                  {t('checkoutRetry')}
                </Button>
              </div>
            )}

            {step === 'delivery' ? (
              <Button type="button" className="h-10 w-full" onClick={goToReview}>
                {t('checkoutContinueToReview')}
              </Button>
            ) : (
              <>
                <Button
                  type="submit"
                  className="h-10 w-full"
                  disabled={isSubmitting || total === undefined}
                >
                  {total === undefined
                    ? t('checkoutPlaceOrder', { total: '…' })
                    : t('checkoutPlaceOrder', { total: formatPrice(total) })}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full"
                  onClick={() => setStep('delivery')}
                >
                  {t('back')}
                </Button>
              </>
            )}
            </CardContent>
          </Card>
        </div>
      </form>
    </AppContent>
  );
}

/** Mirrors the two-column grid the real form and summary card render into, rather than the generic dashboard
 * shape - the step indicator, a tall form-field card on the left, and a shorter order-summary card on the
 * right, matching where the real content lands well enough that neither column visibly reflows. */
function CheckoutPageSkeleton() {
  return (
    <div aria-busy="true">
      <div className="mb-4 flex gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardContent className="flex flex-col gap-6">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
