import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/auth-provider';
import { defaultLanguage, supportedLanguages } from '@/lib/i18n';
import deFlag from '@/assets/flags/de.png';
import roFlag from '@/assets/flags/ro.png';
import esFlag from '@/assets/flags/es.png';
import frFlag from '@/assets/flags/fr.png';
import enFlag from '@/assets/flags/gb.png';

const flagByCode: Record<string, string> = {
  en: enFlag,
  de: deFlag,
  es: esFlag,
  fr: frFlag,
  ro: roFlag,
};

// Deriving from `supportedLanguages` (registered in lib/i18n.ts, which matches the backend `Language` enum) means
// the switcher can never drift from what's actually registered - picking an unsupported code used to silently fall
// back to English while still showing that code's flag in the trigger.
const languages = supportedLanguages.map((code) => ({
  code,
  flag: <img className="size-4" src={flagByCode[code]} alt={`${code.toUpperCase()}Flag`} />,
}));

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  // A signed-in member already has a preferred language set on their profile; this
  // switcher is only for a visitor choosing a language before they have an account.
  // `user`, not `accessToken` - see `TopNav` for why: the server-resolved snapshot always
  // nulls the token, and this component renders server-side on every authenticated page.
  if (user) return null;

  // The second `find` can't actually miss - `defaultLanguage` is a `supportedLanguages` member by
  // construction (see `lib/i18n-config.ts`), and `languages` is an unfiltered map over that same
  // list - so this asserts the invariant instead of silently reintroducing a third, English-first
  // fallback (`languages[0]`) that would only ever mask that invariant breaking, not handle it.
  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) ||
    languages.find((lang) => lang.code === defaultLanguage)!;

  const handleLanguageChange = (langCode: string | null) => {
    i18n.changeLanguage(langCode || defaultLanguage);
    // Store preference in localStorage (handled by i18next-browser-languagedetector)
  };

  return (
    <Select
      onValueChange={(value) => handleLanguageChange(value)}
      value={currentLanguage.code}
      items={languages.map((tf) => ({
        label: tf.code,
        value: tf.code,
      }))}
    >
      <SelectTrigger id="language-select">
        <SelectValue>
          {languages.find((tf) => tf.code === currentLanguage.code)?.flag}
          <span className="ml-2 uppercase text-xs">
            {languages.find((tf) => tf.code === currentLanguage.code)?.code}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="min-w-[90px]">
        <SelectGroup>
          <SelectLabel>{t('languageSelect')}</SelectLabel>
          {languages.map((tf) => (
            <SelectItem key={tf.code} value={tf.code}>
              {tf.flag}
              <span className="ml-2 uppercase text-xs">{tf.code}</span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
