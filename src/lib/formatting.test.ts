import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatDayDate,
  formatTime,
  formatTimeRange,
  parseIsoDate,
  parseIsoLocalDateTime,
  toIsoDate,
  toIsoDateTime,
} from '@/lib/formatting';

describe('parseIsoDate', () => {
  it('parses a date-only string as a local calendar day (no UTC day shift)', () => {
    const date = parseIsoDate('2026-07-11');
    expect(date).not.toBeNull();
    // Would be 10 or 12 in a non-UTC zone if parsed as `new Date("2026-07-11")`.
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(6); // July (0-indexed)
    expect(date?.getDate()).toBe(11);
  });

  it('returns null for an empty string', () => {
    expect(parseIsoDate('')).toBeNull();
  });
});

describe('toIsoDate', () => {
  it('round-trips a date-only string without shifting the calendar day', () => {
    // The core regression guard: parse then re-serialize must be identity.
    expect(toIsoDate(parseIsoDate('2026-07-11') ?? undefined)).toBe(
      '2026-07-11',
    );
    expect(toIsoDate(parseIsoDate('2026-01-01') ?? undefined)).toBe(
      '2026-01-01',
    );
  });

  it('returns an empty string for undefined', () => {
    expect(toIsoDate(undefined)).toBe('');
  });
});

describe('toIsoDateTime', () => {
  it('combines a date and a HH:mm time, pinning seconds', () => {
    const date = parseIsoDate('2026-07-11')!;
    expect(toIsoDateTime(date, '14:30')).toBe('2026-07-11T14:30:00');
  });

  it('preserves an already-seconds time', () => {
    const date = parseIsoDate('2026-07-11')!;
    expect(toIsoDateTime(date, '14:30:45')).toBe('2026-07-11T14:30:45');
  });
});

describe('parseIsoLocalDateTime', () => {
  it('splits a wire datetime into a local date and HH:mm time', () => {
    const { date, time } = parseIsoLocalDateTime('2026-07-11T14:30:00');
    expect(date?.getDate()).toBe(11);
    expect(time).toBe('14:30');
  });

  it('handles an empty value', () => {
    expect(parseIsoLocalDateTime('')).toEqual({ date: null, time: '00:00' });
  });
});

describe('formatDate', () => {
  it('formats a date-only string on the same calendar day', () => {
    const out = formatDate('2026-07-11');
    expect(out).toContain('11');
    expect(out).toContain('2026');
  });

  it('accepts a Date and matches the equivalent string', () => {
    const date = parseIsoDate('2026-07-11')!;
    expect(formatDate(date)).toBe(formatDate('2026-07-11'));
  });

  it('renders the date portion of a datetime value', () => {
    expect(formatDate('2026-07-11T23:15:00')).toContain('11');
  });
});

describe('formatDateTime', () => {
  it('includes both the date and the time', () => {
    const out = formatDateTime('2026-07-11T14:30:00');
    expect(out).toContain('2026');
    expect(out).toMatch(/2:30/);
  });
});

describe('formatTime', () => {
  it('formats a HH:mm:ss time-only string', () => {
    expect(formatTime('09:05:00')).toMatch(/9:05/);
  });

  it('formats a HH:mm time-only string', () => {
    expect(formatTime('09:05')).toMatch(/9:05/);
  });

  it('formats the time portion of a datetime string', () => {
    expect(formatTime('2026-07-11T09:05:00')).toMatch(/9:05/);
  });
});

describe('formatTimeRange', () => {
  it('joins two datetimes with an en dash', () => {
    const out = formatTimeRange('2026-07-11T09:00:00', '2026-07-11T10:30:00');
    expect(out).toMatch(/9:00/);
    expect(out).toMatch(/10:30/);
    expect(out).toContain('–');
  });
});

describe('formatDayDate', () => {
  it('prefixes a short weekday by default', () => {
    // 2026-07-11 is a Saturday.
    expect(formatDayDate('2026-07-11')).toContain('Sat');
  });

  it('uses the long weekday when requested', () => {
    expect(formatDayDate('2026-07-11', { long: true })).toContain('Saturday');
  });
});
