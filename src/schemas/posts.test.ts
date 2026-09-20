import { describe, expect, it } from 'vitest';
import type { PostDetail } from '@/schemas/posts';
import {
  MAX_TAGS,
  MAX_TAG_LENGTH,
  emptyPostSaveInput,
  findTagsProblem,
  isHttpsUrl,
  isImageRef,
  postToSaveInput,
} from '@/schemas/posts';

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

describe('isImageRef', () => {
  it.each([
    'https://example.com/a.jpg',
    '/v1/post-images/3f2b8c1e-9d4a-4e7b-8a1c-2b6d5e4f3a10.png',
    '/v1/post-images/3f2b8c1e-9d4a-4e7b-8a1c-2b6d5e4f3a10.jpeg',
  ])('accepts %s', (value) => expect(isImageRef(value)).toBe(true));

  it.each([
    'http://example.com/a.jpg',
    '/v1/post-images/../../etc/passwd',
    '/v1/post-images/abc.png',
    '/v1/files/download-picture/x/y.png',
    '',
  ])('rejects %s', (value) => expect(isImageRef(value)).toBe(false));
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

describe('postToSaveInput', () => {
  const post = {
    title: 'T',
    excerpt: 'Derived from the body.',
    customExcerpt: null,
    bodyMarkdown: 'Derived from the body.',
    coverImageUrl: null,
    tags: ['a', 'b'],
    gallery: [],
  } as unknown as PostDetail;

  it('is the blank form for a new post', () => {
    expect(postToSaveInput(undefined)).toBe(emptyPostSaveInput);
  });

  it('prefills a hand-written excerpt', () => {
    expect(postToSaveInput({ ...post, customExcerpt: 'Mine' }).excerpt).toBe('Mine');
  });

  it('leaves an auto-derived excerpt blank so it keeps following the body', () => {
    expect(postToSaveInput(post).excerpt).toBeNull();
  });

  it('joins the tags for the raw tags field', () => {
    expect(postToSaveInput(post).tagsInput).toBe('a, b');
  });
});
