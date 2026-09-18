import { format, parse, parseISO } from 'date-fns';

// Formats phone numbers with spaces while typing.
// Rules:
// - Preserve a single leading '+' if present
// - Remove any non-digits (besides a leading '+')
// - If it looks like a local mobile starting with '0' (e.g. 07xx-xxx-xxx), format 4-3-3 where possible
// - Otherwise, group digits in blocks of 3 after the country code
export const formatPhoneNumber = (input: string | null): string => {
  if (!input) return '';

  // Keep a single leading plus if present
  const hasPlus = input.trim().startsWith('+');
  // Strip everything except digits
  const digits = input.replaceAll(/\D/g, '');

  if (digits.length === 0) return hasPlus ? '+' : '';

  // Local style: 07xx xxx xxx (4-3-3)
  if (!hasPlus && digits.startsWith('07')) {
    const part1 = digits.slice(0, 4);
    const part2 = digits.slice(4, 7);
    const part3 = digits.slice(7, 10);
    return [part1, part2, part3].filter(Boolean).join(' ');
  }

  // International style: +CCC XXX XXX XXXX ... (group by 3 after country code)
  // Guess a country code of up to 3 digits; keep simple grouping for UX

  if (hasPlus && digits.startsWith('40')) {
    const country = digits.slice(0, 2);
    const rest = digits.slice(2, digits.length);
    const groups: Array<string> = [];
    for (let i = 0; i < rest.length && groups.length < 3; i += 3) {
      groups.push(rest.slice(i, i + 3));
    }
    return `+${country}${groups.length ? ' ' + groups.join(' ') : ''}`;
  }

  if (hasPlus) {
    return `+${digits}`;
  }
  return digits;
};

// Price display, always "129,00 RON". Pinned to ro-RO rather than following the active locale, unlike every
// date helper in this file, because prices are the first thing this app renders on the *server*: the catalogue
// routes are SSR (`routes/shop/`). One Node process serves every visitor, so it has no per-visitor locale to
// render with - it falls back to the process default (en-US) and would then hydrate a "129,00" client render
// over the "129.00" it had just sent, for every Romanian visitor. A fixed locale is identical on both sides by
// construction.
//
// It is also the honest format: this shop sells only in Romania, only in RON (ROADMAP.md), so a price does not
// change meaning with the UI language. The previous implementation read `globalThis.myApp_dateLocaleString`,
// which only `useLanguageAndFormat` writes - on login and on a profile language change - so it was never set at
// all for the anonymous shopper these pages are built for.
const PRICE_FORMAT = new Intl.NumberFormat('ro-RO', {
  style: 'currency',
  currency: 'RON',
});

export const formatPrice = (amount: number): string => PRICE_FORMAT.format(amount);

// Rounds a money value to the nearest cent (RON's minor unit) after a JS float multiplication -
// `19.9 * 3` is `59.699999999999996` in floating point, unlike the backend's `BigDecimal`. Display
// alone is already saved by `PRICE_FORMAT`'s own rounding, but a total computed from this value
// (a line's `unitPrice * quantity`, or a cart's summed subtotal) should not carry that drift forward
// into anything beyond display, such as a future discount calculation or a value sent to the server.
export const roundToCents = (amount: number): number => Math.round(amount * 100) / 100;

export const formatMonthShort = (date: Date) => {
  return date.toLocaleString(globalThis.myApp_dateLocaleString, {
    month: 'short',
  });
};

// Parse an API date/datetime string (offset-less ISO) into a local Date.
// Never call `new Date(apiString)` on an API value: it parses a date-only
// string (`YYYY-MM-DD`) as UTC midnight and shifts the calendar day in
// negative-offset timezones. `parseISO` parses both date-only and offset-less
// datetime strings as local time, so it is the one safe parser for every
// date/time string the backend sends.
export const toDate = (value: string | Date): Date =>
  typeof value === 'string' ? parseISO(value) : value;

const parseTimeOfDay = (value: string): Date =>
  parse(value, value.length > 5 ? 'HH:mm:ss' : 'HH:mm', new Date());

// Date-only display, e.g. "Jul 11, 2026".
export const formatDate = (value: string | Date): string =>
  format(toDate(value), 'PP');

// Timestamp / scheduled datetime display, e.g. "Jul 11, 2026, 2:30 PM".
export const formatDateTime = (value: string | Date): string =>
  format(toDate(value), 'PPp');

// Time-of-day display, e.g. "2:30 PM". Accepts a time-only string
// (`HH:mm[:ss]`, category C) or the time portion of a datetime value
// (category A/D).
export const formatTime = (value: string | Date): string => {
  if (typeof value !== 'string') return format(value, 'p');
  const date = value.includes('T') ? parseISO(value) : parseTimeOfDay(value);
  return format(date, 'p');
};

// Time range of two datetimes (or times), e.g. "2:30 PM – 3:30 PM".
export const formatTimeRange = (
  start: string | Date,
  end: string | Date,
): string => `${formatTime(start)} – ${formatTime(end)}`;

// Weekday + date, e.g. "Sat, Jul 11, 2026" (short) or
// "Saturday, Jul 11, 2026" (long).
export const formatDayDate = (
  value: string | Date,
  { long = false }: { long?: boolean } = {},
): string => format(toDate(value), long ? 'EEEE, PP' : 'EEE, PP');

// Build a wire date-only string (`YYYY-MM-DD`) from a local Date.
export const toIsoDate = (date: Date | undefined): string =>
  date ? format(date, 'yyyy-MM-dd') : '';

// Build a wire offset-less datetime string (`YYYY-MM-DDTHH:mm:ss`) from a local
// Date and a `HH:mm` (or `HH:mm:ss`) time.
export const toIsoDateTime = (date: Date, time: string): string => {
  const t = time.length === 5 ? `${time}:00` : time || '00:00:00';
  return `${format(date, 'yyyy-MM-dd')}T${t}`;
};

// Split a wire datetime string into its calendar date (as a local Date) and
// `HH:mm` time-of-day, for the combined date+time picker.
export function parseIsoLocalDateTime(value: string): {
  date: Date | null;
  time: string;
} {
  if (!value) return { date: null, time: '00:00' };
  const [datePart = '', timePart = ''] = value.split('T');
  const date = datePart ? parseISO(datePart) : null;
  const time = timePart.slice(0, 5) || '00:00';
  return { date: date && !isNaN(date.getTime()) ? date : null, time };
}

// Parse a wire date-only string (`YYYY-MM-DD`) into a local Date, or null.
export const parseIsoDate = (value: string): Date | null => {
  if (!value) return null;
  const date = parseISO(value);
  return isNaN(date.getTime()) ? null : date;
};
