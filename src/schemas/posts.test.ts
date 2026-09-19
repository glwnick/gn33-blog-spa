import { describe, expect, it } from 'vitest';
import { isHttpsUrl } from '@/schemas/posts';

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
