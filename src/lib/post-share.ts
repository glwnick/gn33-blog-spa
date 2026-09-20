import type { PostDetail } from '@/schemas/posts';
import { BRAND_NAME, SITE_URL } from '@/config/brand';
import { resolveImageUrl } from '@/lib/image-url';

/** Canonical public URL of a post. Built from the site origin, never `window.location`, so SSR and the client agree. */
export const postUrl = (postId: string): string =>
  `${SITE_URL}/posts/${postId}`;

/** Link previews want an absolute image URL; an uploaded cover is site-relative to the API origin. */
export const absoluteImageUrl = (value: string | null): string =>
  value ? resolveImageUrl(value) : `${SITE_URL}/nLogoColorBG.png`;

/** Head tags for a post page: its own title, description, OG/Twitter card and canonical, over the site-wide defaults. */
export function buildPostHead(
  post: Pick<PostDetail, 'id' | 'title' | 'excerpt' | 'coverImageUrl'>,
) {
  const url = postUrl(post.id);
  const image = absoluteImageUrl(post.coverImageUrl);
  const title = `${post.title} | ${BRAND_NAME}`;
  return {
    meta: [
      { title },
      { name: 'title', content: title },
      { name: 'description', content: post.excerpt },
      { property: 'og:type', content: 'article' },
      { property: 'og:url', content: url },
      { property: 'og:title', content: post.title },
      { property: 'og:description', content: post.excerpt },
      { property: 'og:image', content: image },
      { property: 'twitter:url', content: url },
      { property: 'twitter:title', content: post.title },
      { property: 'twitter:description', content: post.excerpt },
      { property: 'twitter:image', content: image },
    ],
    links: [{ rel: 'canonical', href: url }],
  };
}

export type ShareNetwork = 'x' | 'facebook' | 'linkedin' | 'whatsapp';

export const SHARE_NETWORKS: ReadonlyArray<ShareNetwork> = [
  'x',
  'facebook',
  'linkedin',
  'whatsapp',
];

export function shareNetworkUrl(
  network: ShareNetwork,
  url: string,
  title: string,
): string {
  const u = encodeURIComponent(url);
  const text = encodeURIComponent(title);
  switch (network) {
    case 'x':
      return `https://twitter.com/intent/tweet?url=${u}&text=${text}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
  }
}
