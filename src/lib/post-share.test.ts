import { describe, expect, it } from 'vitest';
import {
  absoluteImageUrl,
  buildPostHead,
  postUrl,
  shareNetworkUrl,
} from './post-share';

describe('post-share', () => {
  it('builds the canonical post url from the site origin', () => {
    expect(postUrl('abc')).toBe('https://blog.gn33.eu/posts/abc');
  });

  it('falls back to the site logo when there is no cover', () => {
    expect(absoluteImageUrl(null)).toBe('https://blog.gn33.eu/nLogoColorBG.png');
    expect(absoluteImageUrl('https://x.test/a.png')).toBe('https://x.test/a.png');
  });

  it('gives a post its own title, description, card and canonical', () => {
    const head = buildPostHead({
      id: 'abc',
      title: 'State-of-the-art trips',
      excerpt: 'Released 2026-09-20, snake_case intact.',
      coverImageUrl: 'https://x.test/cover.png',
    });
    const meta = Object.fromEntries(
      head.meta.map((m) => [
        'property' in m ? m.property : 'name' in m ? m.name : 'title',
        'content' in m ? m.content : m.title,
      ]),
    );

    expect(meta.title).toBe('State-of-the-art trips | GN33 Blog');
    // Hyphens and underscores in the backend-derived excerpt pass through untouched.
    expect(meta['og:description']).toBe('Released 2026-09-20, snake_case intact.');
    expect(meta.description).toBe(meta['og:description']);
    expect(meta['og:url']).toBe('https://blog.gn33.eu/posts/abc');
    expect(meta['og:image']).toBe('https://x.test/cover.png');
    expect(head.links).toEqual([
      { rel: 'canonical', href: 'https://blog.gn33.eu/posts/abc' },
    ]);
  });

  it('encodes the url and title into each network link', () => {
    const url = 'https://blog.gn33.eu/posts/a b';
    expect(shareNetworkUrl('x', url, 'A & B')).toContain('text=A%20%26%20B');
    expect(shareNetworkUrl('facebook', url, 't')).toContain(
      encodeURIComponent(url),
    );
    expect(shareNetworkUrl('linkedin', url, 't')).toContain(
      encodeURIComponent(url),
    );
    expect(shareNetworkUrl('whatsapp', url, 't')).toContain('wa.me/?text=');
  });
});
