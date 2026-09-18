import { describe, expect, it } from 'vitest';
import { urlBase64ToUint8Array } from './web-push';

describe('urlBase64ToUint8Array', () => {
  it('decodes a base64url VAPID public key into a 65-byte uncompressed EC point', () => {
    // A throwaway P-256 VAPID public key: 0x04 prefix (uncompressed point) + 32-byte X + 32-byte Y = 65 bytes.
    const key =
      'BE_dAduhipX8WeWLrmsnWQYJ9zaF_6jQltshEPhdL_g-6cPslWqjjScxq6FvJXefSamTPtsqhtVv6mpW4nZgD-o';

    const bytes = urlBase64ToUint8Array(key);

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBe(65);
    expect(bytes[0]).toBe(0x04);
  });

  it('handles input that needs no padding', () => {
    // 8 base64url chars decode to exactly 6 bytes, a multiple of 4 chars needing zero '=' padding.
    const bytes = urlBase64ToUint8Array('AAAAAAAA');
    expect(bytes.length).toBe(6);
  });

  it('correctly substitutes url-safe characters back to standard base64', () => {
    // '-' and '_' stand in for '+' and '/'; decoding must translate them back before atob.
    const dashUnderscore = urlBase64ToUint8Array('--__');
    const plusSlash = Uint8Array.from(atob('++//'), (c) => c.charCodeAt(0));
    expect(Array.from(dashUnderscore)).toEqual(Array.from(plusSlash));
  });
});
