import { describe, expect, it } from 'vitest';
import { MAX_TAGS, MAX_TAG_LENGTH, findTagsProblem, isHttpsUrl } from '@/schemas/posts';

describe('isHttpsUrl', () => {
  it.each(['https://example.com/a.jpg', 'https://cdn.example.com/x?y=1'])(
    'accepts %s',
    (value) => expect(isHttpsUrl(value)).toBe(true),
  );

  it.each([
    'http://example.com/a.jpg',
    'javascript:alert(1)',
    'data:image/png;base64,AAAA',
    'example.com/a.jpg',
    'https://exa mple.com',
    '',
  ])('rejects %s', (value) => expect(isHttpsUrl(value)).toBe(false));
});

describe('findTagsProblem', () => {
  it('accepts blank and normal input', () => {
    expect(findTagsProblem('')).toBeNull();
    expect(findTagsProblem(' travel, Mountains ,travel,, ')).toBeNull();
  });

  it('counts tags after trimming, lowercasing and de-duplicating, like the backend', () => {
    const atLimit = Array.from({ length: MAX_TAGS }, (_, i) => `t${i}`);
    expect(findTagsProblem(atLimit.join(','))).toBeNull();
    expect(findTagsProblem([...atLimit, 'T0', ' t1 '].join(','))).toBeNull();
    expect(findTagsProblem([...atLimit, 'extra'].join(','))).toBe('tooMany');
  });

  it('flags a tag over the length limit', () => {
    expect(findTagsProblem('x'.repeat(MAX_TAG_LENGTH))).toBeNull();
    expect(findTagsProblem('x'.repeat(MAX_TAG_LENGTH + 1))).toBe('tooLong');
  });

  it('flags a raw field over the backend size cap', () => {
    expect(findTagsProblem('a,'.repeat(501))).toBe('inputTooLong');
  });
});
