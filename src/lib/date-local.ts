import { defaultLocale } from 'react-day-picker';
import {
  bg,
  de,
  el,
  enGB,
  es,
  fr,
  hu,
  it,
  pl,
  ro,
} from 'react-day-picker/locale';

import {
  bg as bgFns,
  de as deFns,
  el as elFns,
  fr as frFns,
  hu as huFns,
  it as itFns,
  pl as plFns,
  ro as roFns,
} from 'date-fns/locale';

export const supportedDates = {
  utc: {
    timeZone: 'UTC',
    locale: defaultLocale,
    localeString: 'UTC',
    fnsLocale: enGB,
  },
  bg: {
    timeZone: 'Europe/Sofia',
    locale: bg,
    localeString: 'bg-BG',
    fnsLocale: bgFns,
  },
  de: {
    timeZone: 'Europe/Berlin',
    locale: de,
    localeString: 'de-DE',
    fnsLocale: deFns,
  },
  en: {
    timeZone: 'Europe/London',
    locale: enGB,
    localeString: 'en-GB',
    fnsLocale: enGB,
  },
  es: {
    timeZone: 'Europe/Madrid',
    locale: es,
    localeString: 'es-ES',
    fnsLocale: es,
  },
  fr: {
    timeZone: 'Europe/Paris',
    locale: fr,
    localeString: 'fr-FR',
    fnsLocale: frFns,
  },
  gr: {
    timeZone: 'Europe/Athens',
    locale: el,
    localeString: 'el-GR',
    fnsLocale: elFns,
  },
  hu: {
    timeZone: 'Europe/Budapest',
    locale: hu,
    localeString: 'hu-HU',
    fnsLocale: huFns,
  },
  it: {
    timeZone: 'Europe/Rome',
    locale: it,
    localeString: 'it-IT',
    fnsLocale: itFns,
  },
  pl: {
    timeZone: 'Europe/Warsaw',
    locale: pl,
    localeString: 'pl-PL',
    fnsLocale: plFns,
  },
  ro: {
    timeZone: 'Europe/Bucharest',
    locale: ro,
    localeString: 'ro-RO',
    fnsLocale: roFns,
  },
};
