import { Link, createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { ChevronLeftIcon, ShieldCheck } from 'lucide-react';

import { revalidateLogic } from '@tanstack/react-form';

import { LegalDocumentDialog } from './-legal-document-dialog';
import {
  RESEND_PIN_COOLDOWN_SECONDS,
  ResendPinButton,
} from './-resend-pin-button';
import { StepOverview } from './-step-overview';
import {
  STEP_NAME_KEYS,
  TOTAL_STEPS,
  fieldOwningStep,
  validateWizardStep,
} from './-wizard-steps';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FieldGroup, FieldSeparator, FieldSet } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { Progress } from '@/components/ui/progress';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useTranslation } from '@/hooks/use-translation';

import { OtpField } from '@/components/two-factor/otp-field';
import { signupPinCode, signupUser } from '@/api/auth-api';
import { useAuth } from '@/context/auth-provider';
import { HeaderAlert } from '@/components/header-alert';
import AvatarUploader from '@/components/avatar-uploader';

import Logo from '@/components/logo';
import { useAppForm } from '@/hooks/use-form';
import {
  defaultUserSignUpInputValues,
  userSignInInputSchema,
} from '@/schemas/auth';

import TextareaField from '@/components/form/textarea-field';
import { useAlertMutation } from '@/hooks/use-alert-mutation';

export const Route = createFileRoute('/_no-auth/register/')({
  component: RegisterPage,
});

// Steps 5 (Photo) and 6 (Done) render after the account is already created and the
// user logged in; a hard refresh on those steps bounces back here via `_no-auth`'s
// beforeLoad since `login()` does not invalidate the router. That is acceptable: the
// account exists and the photo can still be added later from the profile page.

const WizardProgress = ({ currentStep }: { currentStep: number }) => {
  const { t } = useTranslation();
  const stepName = t(STEP_NAME_KEYS[currentStep - 1]);

  return (
    <div className="flex flex-col gap-1.5">
      {/* Progress renders its own track; children are only for label/value slots. The track keeps its
          default muted background rather than a primary-family tint - with both track and indicator in
          the same colour family, the filled and unfilled portions were nearly indistinguishable. */}
      <Progress value={(currentStep / TOTAL_STEPS) * 100} className="h-1.5" />
      <span className="text-center text-sm text-muted-foreground select-none">
        {t('registerStepProgress', {
          current: currentStep,
          total: TOTAL_STEPS,
          name: stepName,
        })}
      </span>
    </div>
  );
};

function RegisterPage() {
  const { t } = useTranslation();

  const [currentStep, setCurrentStep] = useState(1);
  const [validatingStep, setValidatingStep] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState<string>();
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [gdprDialogOpen, setGdprDialogOpen] = useState(false);
  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const navigate = Route.useNavigate();

  const { login } = useAuth();

  const {
    mutateAsync: registerUser,
    isPending: registerUserPending,
    alertError: registerUserError,
    clearAlertError: clearRegisterUserError,
  } = useAlertMutation({
    mutationFn: signupUser,
    onSuccess: (data) => {
      if (data.accessToken && data.user) {
        login({ accessToken: data.accessToken, user: data.user });
        setLoggedInUserId(data.user.userId);
        setCurrentStep(5);
      }
    },
    onError: (error) => {
      // A wrong/expired PIN is a step-4 problem: stay there so the user can
      // retype or go Back to re-send, instead of restarting at Account.
      if (error.errorType === 'PIN_CODE') return;
      const failingField = error.validationErrors?.[0]?.field;
      const step = (failingField && fieldOwningStep(failingField)) || 1;
      setCurrentStep(step);
    },
  });

  const {
    mutateAsync: mutateSignupPinCode,
    isPending: signupPinCodePending,
    alertError: pinCodeError,
    clearAlertError: clearPinCodeError,
  } = useAlertMutation({
    mutationFn: signupPinCode,
    onSuccess: () => {
      setCurrentStep(4);
      setResendAvailableAt(Date.now() + RESEND_PIN_COOLDOWN_SECONDS * 1000);
    },
  });

  const registerForm = useAppForm({
    defaultValues: defaultUserSignUpInputValues,
    validators: { onDynamic: userSignInInputSchema },
    validationLogic: revalidateLogic(),
  });

  const resendPinCode = () =>
    // Failures surface through pinCodeError; swallow the rejection.
    mutateSignupPinCode(registerForm.state.values.email).catch(() => undefined);

  const handleNext = async () => {
    setValidatingStep(true);
    const valid = await validateWizardStep(registerForm, currentStep);
    setValidatingStep(false);
    if (!valid) return;

    if (currentStep === 3) {
      clearPinCodeError();
      clearRegisterUserError();
      await resendPinCode();
    } else {
      setCurrentStep((step) => step + 1);
    }
  };

  return (
    // Logo and heading sit above the card, not inside it - same treatment as the login page's own screen
    // (routes/_no-auth/login/index.tsx), rather than bundled into this card's CardHeader.
    <div className="flex w-full max-w-sm flex-col gap-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <Logo logoClassName="size-11" />
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-semibold tracking-tight">
            {t('registerTitle')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('registerSubtitle')}
          </p>
        </div>
      </div>

      <WizardProgress currentStep={currentStep} />

      <Card className="w-full">
        {(pinCodeError || registerUserError) && (
          <CardHeader>
            <HeaderAlert error={pinCodeError || registerUserError} />
          </CardHeader>
        )}

        {registerUserPending && (
          <CardContent className="flex items-center justify-center">
            <Spinner className="size-12" />
          </CardContent>
        )}

        {!registerUserPending && currentStep === 1 && (
          <>
            <CardContent>
              <FieldGroup>
                <FieldSet>
                  <registerForm.AppField
                    name="email"
                    children={(field) => (
                      <field.TextField
                        label={t('email')}
                        type="email"
                        mandatoryLabel
                      />
                    )}
                  />
                  <registerForm.AppField
                    name="password"
                    children={(field) => (
                      <field.PasswordField
                        label={t('password')}
                        mandatoryLabel
                      />
                    )}
                  />
                </FieldSet>
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleNext}
                  disabled={validatingStep}
                >
                  {validatingStep ? <Spinner /> : t('next')}
                </Button>
              </FieldGroup>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <div className="flex justify-center mt-2 text-center text-sm gap-2">
                <span>{t('haveAccount')} </span>
                <Link
                  to="/login"
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {t('signIn')}
                </Link>
              </div>
            </CardFooter>
          </>
        )}

        {!registerUserPending && currentStep === 2 && (
          <CardContent>
            <FieldGroup>
              <FieldSet>
                <registerForm.AppField
                  name="firstName"
                  children={(field) => (
                    <field.TextField label={t('firstName')} mandatoryLabel />
                  )}
                />
                <registerForm.AppField
                  name="lastName"
                  children={(field) => (
                    <field.TextField label={t('lastName')} mandatoryLabel />
                  )}
                />
                <registerForm.AppField
                  name="phoneNumber"
                  children={(field) => (
                    <field.PhoneField label={t('phoneNumber')} mandatoryLabel />
                  )}
                />
              </FieldSet>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                >
                  <ChevronLeftIcon className="size-5" />
                  {t('back')}
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleNext}
                  disabled={validatingStep}
                >
                  {validatingStep ? <Spinner /> : t('next')}
                </Button>
              </div>
            </FieldGroup>
          </CardContent>
        )}

        {!registerUserPending && currentStep === 3 && (
          <CardContent>
            <FieldGroup>
              <FieldSet>
                <registerForm.AppField
                  name="termsAccepted"
                  children={(field) => (
                    <field.CheckboxField
                      label={t('termsAccepted')}
                      description={t('termsAcceptedText')}
                      mandatoryLabel
                    >
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto justify-start p-0"
                        onClick={() => setTermsDialogOpen(true)}
                      >
                        {t('viewTerms')}
                      </Button>
                    </field.CheckboxField>
                  )}
                />
                <registerForm.AppField
                  name="gdprConsentGiven"
                  children={(field) => {
                    return (
                      <field.CheckboxField
                        label={t('gdprConsentGiven')}
                        description={t('gdprConsentGivenText')}
                        mandatoryLabel
                      >
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto justify-start p-0"
                          onClick={() => setGdprDialogOpen(true)}
                        >
                          {t('viewGdpr')}
                        </Button>
                        <Accordion>
                          <AccordionItem value="GDPRDetails">
                            <AccordionTrigger className="py-0">
                              {t('addGDPRConsentDetails')}
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col text-balance">
                              <registerForm.AppField
                                name="gdprConsentDetails"
                                children={() => <TextareaField label="" />}
                              />
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </field.CheckboxField>
                    );
                  }}
                />
              </FieldSet>
              <FieldSeparator />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  disabled={signupPinCodePending}
                >
                  <ChevronLeftIcon className="size-5" />
                  {t('back')}
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleNext}
                  disabled={validatingStep || signupPinCodePending}
                >
                  {validatingStep || signupPinCodePending ? (
                    <Spinner />
                  ) : (
                    t('next')
                  )}
                </Button>
              </div>
            </FieldGroup>
            <LegalDocumentDialog
              type="TERMS"
              title={t('termsAndConditions')}
              open={termsDialogOpen}
              onOpenChange={setTermsDialogOpen}
            />
            <LegalDocumentDialog
              type="GDPR"
              title={t('gdprConsent')}
              open={gdprDialogOpen}
              onOpenChange={setGdprDialogOpen}
            />
          </CardContent>
        )}

        {!registerUserPending && currentStep === 4 && (
          <CardContent>
            <div className="flex flex-col gap-6 items-center">
              <CardTitle className="text-center font-bold">
                {t('pinCodeMessage')}
              </CardTitle>

              <OtpField
                onComplete={(code) =>
                  // Failures surface through registerUserError; swallow the rejection.
                  registerUser({
                    ...registerForm.state.values,
                    pinCode: code,
                  }).catch(() => undefined)
                }
              />
              <ResendPinButton
                resendAvailableAt={resendAvailableAt}
                pending={signupPinCodePending}
                onResend={resendPinCode}
              />
              <Button onClick={() => setCurrentStep(3)} variant="outline">
                <ChevronLeftIcon className="size-5" />
                {t('back')}
              </Button>
            </div>
          </CardContent>
        )}

        {!registerUserPending && currentStep === 5 && loggedInUserId && (
          <CardContent>
            <div className="flex flex-col gap-6 items-center">
              <AvatarUploader
                userId={loggedInUserId}
                onUploadSuccess={() => setCurrentStep(6)}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setCurrentStep(6)}
              >
                {t('skip')}
              </Button>
            </div>
          </CardContent>
        )}

        {!registerUserPending && currentStep === 6 && (
          <CardContent>
            <div className="flex flex-col gap-4 items-center text-center">
              <CardTitle className="font-bold">
                {t('registerWelcomeTitle')}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('registerWelcomeText')}
              </p>
              <Button
                type="button"
                className="w-full"
                onClick={() => navigate({ to: '/' })}
              >
                {t('getStarted')}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {!registerUserPending && currentStep === 4 && (
        <>
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-900/30 dark:text-emerald-400">
            <ShieldCheck />
            <AlertDescription className="text-emerald-700 dark:text-emerald-400/90">
              {t('registerPinAccentNote')}
            </AlertDescription>
          </Alert>
          <StepOverview currentStep={currentStep} />
        </>
      )}
    </div>
  );
}
