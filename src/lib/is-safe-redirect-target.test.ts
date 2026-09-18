import { describe, expect, it } from 'vitest';
import { isSafeRedirectTarget } from './is-safe-redirect-target';

// L7, SECURITY-AUDIT-2026-09-15.md
describe('isSafeRedirectTarget', () => {
  it('accepts a root-relative path', () => {
    expect(isSafeRedirectTarget('/dashboard')).toBe(true);
    expect(isSafeRedirectTarget('/posts/abc-123?foo=bar')).toBe(true);
  });

  it('rejects a protocol-relative path', () => {
    expect(isSafeRedirectTarget('//evil.example.com')).toBe(false);
    expect(isSafeRedirectTarget('//evil.example.com/phish')).toBe(false);
  });

  it('rejects an absolute URL', () => {
    expect(isSafeRedirectTarget('https://evil.example.com')).toBe(false);
    expect(isSafeRedirectTarget('javascript:alert(1)')).toBe(false);
  });

  it('rejects a path with no leading slash', () => {
    expect(isSafeRedirectTarget('home')).toBe(false);
  });

  it('rejects undefined, null and an empty string', () => {
    expect(isSafeRedirectTarget(undefined)).toBe(false);
    expect(isSafeRedirectTarget(null)).toBe(false);
    expect(isSafeRedirectTarget('')).toBe(false);
  });
});
