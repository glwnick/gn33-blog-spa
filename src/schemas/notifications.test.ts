import { describe, expect, it } from 'vitest';
import {
  notificationPreferencesResponseSchema,
  notificationPreferencesSchema,
  whatsappStatusSchema,
  whatsappVerificationRequestSchema,
} from './notifications';

describe('notificationPreferencesResponseSchema', () => {
  it('parses the backend wire shape', () => {
    const payload = { email: true, webPush: false, whatsapp: false };
    expect(notificationPreferencesResponseSchema.parse(payload)).toEqual(
      payload,
    );
  });
});

describe('notificationPreferencesSchema', () => {
  it('parses the form-facing shape', () => {
    const payload = {
      notifyEmail: true,
      notifyWebPush: false,
      notifyWhatsapp: false,
    };
    expect(notificationPreferencesSchema.parse(payload)).toEqual(payload);
  });
});

describe('whatsappStatusSchema', () => {
  it('parses an opted-out status with null number/verifiedAt', () => {
    const payload = { optedIn: false, maskedNumber: null, verifiedAt: null };
    expect(whatsappStatusSchema.parse(payload)).toEqual(payload);
  });

  it('parses a verified status', () => {
    const payload = {
      optedIn: true,
      maskedNumber: '+40•••••78',
      verifiedAt: '2026-07-23T10:00:00',
    };
    expect(whatsappStatusSchema.parse(payload)).toEqual(payload);
  });
});

describe('whatsappVerificationRequestSchema', () => {
  it('accepts a well-formed E.164 number', () => {
    expect(
      whatsappVerificationRequestSchema.parse({ whatsappNumber: '+40712345678' })
        .whatsappNumber,
    ).toBe('+40712345678');
  });

  it('rejects a number missing the leading country code plus sign', () => {
    expect(() =>
      whatsappVerificationRequestSchema.parse({ whatsappNumber: '40712345678' }),
    ).toThrow();
  });

  it('rejects a bare national number with no country code', () => {
    expect(() =>
      whatsappVerificationRequestSchema.parse({ whatsappNumber: '0712345678' }),
    ).toThrow();
  });

  it('rejects an empty string', () => {
    expect(() =>
      whatsappVerificationRequestSchema.parse({ whatsappNumber: '' }),
    ).toThrow();
  });
});
