import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { CheckCircle, Home } from 'lucide-react';
import type { AuthUser } from '@/types/api-types';
import { acceptGdprConsent, acceptTerms } from '@/api/auth-api';
import { legalDocumentOptions } from '@/query-options/legal-document-options';
import { ButtonLink } from '@/components/button-link';
import DarkModeToggle from '@/components/dark-mode-toggle';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Markdown } from '@/components/ui/markdown';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/context/auth-provider';
import { useTranslation } from '@/hooks/use-translation';

export const Route = createFileRoute('/terms/')({
  // Client-only for now, same reasoning as `_auth.tsx`/`_no-auth.tsx`.
  ssr: false,
  beforeLoad: ({ context }) => {
    // See `_auth.tsx`'s regression test for why this has to come first.
    if (context.auth.isInitializing) {
      return;
    }
    // `user`, not `accessToken` - see `_auth.tsx`. This is where `_auth` sends a visitor whose consent
    // is outstanding, so two guards judging "logged in" by different fields is a redirect loop waiting
    // to happen once stage E server-renders this subtree.
    if (!context.auth.user) {
      throw redirect({
        to: '/login',
        search: { redirect: '/terms' },
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { user, setUser } = useAuth();
  const { t } = useTranslation();

  const { data: termsDoc } = useQuery(legalDocumentOptions('TERMS'));
  const { data: gdprDoc } = useQuery(legalDocumentOptions('GDPR'));

  const { mutate: acceptTermsMutation, isPending: isAcceptingTerms } =
    useMutation({
      mutationFn: acceptTerms,
      onSuccess: () => {
        setUser({ ...user, termsAccepted: true } as AuthUser);
      },
    });

  const { mutate: acceptGdprMutation, isPending: isAcceptingGdpr } =
    useMutation({
      mutationFn: acceptGdprConsent,
      onSuccess: () => {
        setUser({ ...user, gdprConsentGiven: true } as AuthUser);
      },
    });

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div
        id="floating-header"
        className="fixed right-4 top-4 z-50 flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
      >
        {/* No LanguageSwitcher: this route's beforeLoad guarantees a session, and the
            switcher renders nothing for a signed-in user (their language comes from
            preferredLanguage on the profile, applied at login). */}
        <DarkModeToggle />
      </div>
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <Logo />
          <CardTitle className="mb-2 font-bold text-2xl">
            {t('termsTitle')}
          </CardTitle>
          <CardDescription>{t('termsMessage')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <LegalSection
            title={t('termsAndConditions')}
            content={termsDoc?.content}
            accepted={!!user?.termsAccepted}
            acceptLabel={t('acceptTerms')}
            isAccepting={isAcceptingTerms}
            onAccept={() => acceptTermsMutation()}
          />
          <LegalSection
            title={t('gdprConsent')}
            content={gdprDoc?.content}
            accepted={!!user?.gdprConsentGiven}
            acceptLabel={t('acceptGdpr')}
            isAccepting={isAcceptingGdpr}
            onAccept={() => acceptGdprMutation()}
          />
          {user?.termsAccepted && user.gdprConsentGiven && (
            <ButtonLink to="/" variant="secondary">
              <Home/>{t('home')}
            </ButtonLink>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type LegalSectionProps = {
  readonly title: string;
  readonly content: string | undefined;
  readonly accepted: boolean;
  readonly acceptLabel: string;
  readonly isAccepting: boolean;
  readonly onAccept: () => void;
};

function LegalSection({
  title,
  content,
  accepted,
  acceptLabel,
  isAccepting,
  onAccept,
}: LegalSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {accepted && (
          <CheckCircle className="size-6 shrink-0 text-lime-600 dark:text-lime-400" />
        )}
      </div>
      <div className="max-h-64 overflow-auto rounded-md border bg-muted/30 p-4">
        {content === undefined ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <Markdown>{content}</Markdown>
        )}
      </div>
      {!accepted && (
        <Button
          variant="outline"
          onClick={onAccept}
          disabled={isAccepting || content === undefined}
          className="self-start"
        >
          {acceptLabel}
          {isAccepting && <Spinner />}
        </Button>
      )}
    </section>
  );
}
