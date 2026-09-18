import { useCallback } from 'react';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { setDefaultOptions as setDateFnsDefaultOptions } from 'date-fns';
import type translation from '@/locales/en.json';
import { supportedDates } from '@/lib/date-local';

export type TranslationKey = keyof typeof translation;

export const useTranslation = () => {
  return useI18nTranslation();
};

export const useLanguageAndFormat = () => {
  const { i18n } = useTranslation();

  // Stable identity (i18n is a singleton) so consumers that depend on this in
  // useCallback/useEffect deps don't re-run every render.
  const setLanguageAndFormat = useCallback(
    (lang: string) => {
      const selectedLanguage = lang.toLowerCase();
      if (i18n.language !== selectedLanguage) {
        i18n.changeLanguage(selectedLanguage);
      }

      const userDate =
        supportedDates[selectedLanguage as keyof typeof supportedDates];
      globalThis.myApp_timeZone = userDate.timeZone;
      globalThis.myApp_dateLocale = userDate.locale;
      globalThis.myApp_dateLocaleString = userDate.localeString;
      setDateFnsDefaultOptions({ locale: userDate.fnsLocale });
    },
    [i18n],
  );

  return { setLanguageAndFormat };
};
