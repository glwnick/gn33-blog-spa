import '@/lib/i18n';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ShareButton } from './share-button';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

const URL = 'https://blog.gn33.eu/posts/p1';

afterEach(() => {
  cleanup();
  // Defined per test below; jsdom has no execCommand of its own.
  Reflect.deleteProperty(document, 'execCommand');
  vi.unstubAllGlobals();
  toast.success.mockReset();
  toast.error.mockReset();
  // jsdom has no share/clipboard by default; stubs above are the only source.
  Reflect.deleteProperty(navigator, 'share');
});

describe('ShareButton', () => {
  it('copies the link from the menu when there is no native share', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    render(<ShareButton url={URL} title="Hello" />);

    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Copy link' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(URL));
    expect(toast.success).toHaveBeenCalledWith('Link copied');
  });

  it('falls back to a selection copy when the clipboard API is denied', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      value: execCommand,
      configurable: true,
    });
    render(<ShareButton url={URL} title="Hello" />);

    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Copy link' }));

    await waitFor(() => expect(execCommand).toHaveBeenCalledWith('copy'));
    expect(toast.success).toHaveBeenCalledWith('Link copied');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('toasts when every copy path fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    Object.defineProperty(document, 'execCommand', {
      value: vi.fn().mockReturnValue(false),
      configurable: true,
    });
    render(<ShareButton url={URL} title="Hello" />);

    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Copy link' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('lists the networks as external links', async () => {
    render(<ShareButton url={URL} title="Hello" />);
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    const link = await screen.findByRole('menuitem', { name: 'Share on Facebook' });
    expect(link.getAttribute('href')).toContain('facebook.com');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('uses the native share sheet when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, share });
    render(<ShareButton url={URL} title="Hello" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Share' }));

    await waitFor(() =>
      expect(share).toHaveBeenCalledWith({ url: URL, title: 'Hello' }),
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('stays quiet when the native sheet is dismissed', async () => {
    const share = vi
      .fn()
      .mockRejectedValue(new DOMException('cancelled', 'AbortError'));
    vi.stubGlobal('navigator', { ...navigator, share });
    render(<ShareButton url={URL} title="Hello" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Share' }));

    await waitFor(() => expect(share).toHaveBeenCalled());
    expect(toast.error).not.toHaveBeenCalled();
  });
});
