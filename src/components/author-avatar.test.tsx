import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthorAvatar } from './author-avatar';

const AUTHOR_ID = '11111111-1111-4111-8111-111111111111';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function stubImageLoad(outcome: 'load' | 'error') {
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    referrerPolicy = '';
    crossOrigin: string | null = null;
    set src(_value: string) {
      queueMicrotask(() => this[outcome === 'load' ? 'onload' : 'onerror']?.());
    }
  }
  vi.stubGlobal('Image', FakeImage);
}

describe('AuthorAvatar', () => {
  it('shows initials when the author has no picture', () => {
    render(
      <AuthorAvatar
        authorId={AUTHOR_ID}
        profilePictureUrl={null}
        firstName="Ada"
        lastName="Lovelace"
      />,
    );

    expect(screen.getByText('AL')).toBeTruthy();
    expect(document.querySelector('img')).toBeNull();
  });

  it('loads the public author-avatar thumbnail once it is available', async () => {
    stubImageLoad('load');
    render(
      <AuthorAvatar
        authorId={AUTHOR_ID}
        profilePictureUrl="pic 1.png"
        firstName="Ada"
        lastName="Lovelace"
      />,
    );

    await waitFor(() => expect(document.querySelector('img')).not.toBeNull());
    expect(document.querySelector('img')?.getAttribute('src')).toContain(
      `/v1/users/${AUTHOR_ID}/author-avatar/pic%201.png`,
    );
  });

  it('keeps the initials when the picture fails to load', async () => {
    stubImageLoad('error');
    render(
      <AuthorAvatar
        authorId={AUTHOR_ID}
        profilePictureUrl="gone.png"
        firstName="Ada"
        lastName="Lovelace"
      />,
    );

    await waitFor(() => expect(screen.getByText('AL')).toBeTruthy());
    expect(document.querySelector('img')).toBeNull();
  });
});
