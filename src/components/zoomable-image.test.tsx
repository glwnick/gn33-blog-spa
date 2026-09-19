import '@/lib/i18n';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ZoomableImage } from './zoomable-image';

afterEach(cleanup);

describe('ZoomableImage', () => {
  it('names the trigger after the image so a gallery is not a list of identical buttons', () => {
    render(<ZoomableImage src="/a.png" alt="A mountain view" />);

    expect(
      screen.getByRole('button', { name: 'View full size: A mountain view' }),
    ).toBeTruthy();
  });

  it('falls back to the bare label when the image has no alt text', () => {
    render(<ZoomableImage src="/a.png" alt="" />);

    expect(screen.getByRole('button', { name: 'View full size' })).toBeTruthy();
  });

  it('opens the full picture in a dialog and closes it again', async () => {
    render(<ZoomableImage src="/a.png" alt="A mountain view" />);
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /View full size/ }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog.querySelector('img')?.getAttribute('src')).toBe('/a.png');

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
