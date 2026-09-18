import '@/lib/i18n';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ImageLightbox, originFor } from './image-lightbox';
import type { ProductImage } from '@/schemas/products';

const rect = (overrides: Partial<DOMRect> = {}): DOMRect => ({
  x: 0,
  y: 0,
  left: 0,
  top: 0,
  right: 200,
  bottom: 100,
  width: 200,
  height: 100,
  toJSON: () => ({}),
  ...overrides,
});

const image = (overrides: Partial<ProductImage> & { url: string }): ProductImage => ({
  altText: '',
  primary: false,
  variantId: null,
  ...overrides,
});

describe('originFor', () => {
  it('computes the click position as a percentage of the rect', () => {
    expect(originFor(50, 25, rect())).toBe('25% 25%');
  });

  it('falls back to a centred origin when the rect has zero width, rather than dividing by zero', () => {
    // The layout a not-yet-loaded image has before the browser knows its intrinsic size - `(x - left) / 0`
    // would otherwise be `Infinity` or `NaN`, an invalid `transform-origin` the browser silently drops.
    expect(originFor(50, 25, rect({ width: 0 }))).toBe('50% 50%');
  });

  it('falls back to a centred origin when the rect has zero height', () => {
    expect(originFor(50, 25, rect({ height: 0 }))).toBe('50% 50%');
  });
});

describe('ImageLightbox', () => {
  it('renders nothing when closed', () => {
    render(
      <ImageLightbox images={[image({ url: 'a' })]} index={0} open={false} onOpenChange={() => {}} onNavigate={() => {}} />,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the image for the given index but no nav controls for a single-image gallery', () => {
    render(
      <ImageLightbox images={[image({ url: 'a', altText: 'Sofia' })]} index={0} open onOpenChange={() => {}} onNavigate={() => {}} />,
    );
    expect(screen.getByRole('img', { name: 'Sofia' })).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Previous image' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Next image' })).toBeNull();
  });

  it('shows nav arrows and a position counter for a multi-image gallery', () => {
    const images = [image({ url: 'a' }), image({ url: 'b' }), image({ url: 'c' })];
    render(<ImageLightbox images={images} index={1} open onOpenChange={() => {}} onNavigate={() => {}} />);
    expect(screen.getByText('2 / 3')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Previous image' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Next image' })).not.toBeNull();
  });

  it('calls onNavigate with index - 1 / index + 1 from the arrows, leaving wrap-around to the caller', () => {
    const onNavigate = vi.fn();
    const images = [image({ url: 'a' }), image({ url: 'b' }), image({ url: 'c' })];
    render(<ImageLightbox images={images} index={1} open onOpenChange={() => {}} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Previous image' }));
    expect(onNavigate).toHaveBeenCalledWith(0);
    fireEvent.click(screen.getByRole('button', { name: 'Next image' }));
    expect(onNavigate).toHaveBeenCalledWith(2);
  });

  it('toggles magnification on click, and drops it again on the next image', () => {
    const images = [image({ url: 'a', altText: 'Front' }), image({ url: 'b', altText: 'Back' })];
    const { rerender } = render(
      <ImageLightbox images={images} index={0} open onOpenChange={() => {}} onNavigate={() => {}} />,
    );
    const img = screen.getByRole('img');
    expect(img.className).toContain('cursor-zoom-in');

    fireEvent.click(img, { clientX: 10, clientY: 10 });
    expect(img.className).toContain('scale-[2.5]');
    expect(img.className).toContain('cursor-zoom-out');

    // Moving to the next photo drops the zoom rather than carrying a magnified crop over to a different image.
    rerender(<ImageLightbox images={images} index={1} open onOpenChange={() => {}} onNavigate={() => {}} />);
    expect(screen.getByRole('img').className).not.toContain('scale-[2.5]');
  });

  it('pans the zoomed origin from mousemove, throttled to one update per animation frame', async () => {
    const getBoundingClientRect = vi
      .spyOn(HTMLImageElement.prototype, 'getBoundingClientRect')
      .mockReturnValue(rect());
    render(
      <ImageLightbox images={[image({ url: 'a', altText: 'Photo' })]} index={0} open onOpenChange={() => {}} onNavigate={() => {}} />,
    );
    const img = screen.getByRole('img');
    fireEvent.click(img, { clientX: 100, clientY: 50 });
    expect(img.style.transformOrigin).toBe('50% 50%');

    // Firing twice before a frame has run should only leave the *last* position applied, not both in sequence -
    // that's the throttle actually doing something rather than a no-op wrapper around every raw event.
    fireEvent.mouseMove(img, { clientX: 20, clientY: 10 });
    fireEvent.mouseMove(img, { clientX: 60, clientY: 90 });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(img.style.transformOrigin).toBe('30% 90%');

    getBoundingClientRect.mockRestore();
  });

  it('pans the zoomed origin from a touch drag, since mousemove never fires on touch input', async () => {
    const getBoundingClientRect = vi
      .spyOn(HTMLImageElement.prototype, 'getBoundingClientRect')
      .mockReturnValue(rect());
    render(
      <ImageLightbox images={[image({ url: 'a', altText: 'Photo' })]} index={0} open onOpenChange={() => {}} onNavigate={() => {}} />,
    );
    const img = screen.getByRole('img');
    fireEvent.click(img, { clientX: 100, clientY: 50 });

    fireEvent.touchMove(img, { touches: [{ clientX: 100, clientY: 20 }] });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(img.style.transformOrigin).toBe('50% 20%');

    getBoundingClientRect.mockRestore();
  });

  it('ignores a touchmove with no touches rather than throwing', () => {
    render(
      <ImageLightbox images={[image({ url: 'a', altText: 'Photo' })]} index={0} open onOpenChange={() => {}} onNavigate={() => {}} />,
    );
    const img = screen.getByRole('img');
    fireEvent.click(img, { clientX: 10, clientY: 10 });
    expect(() => fireEvent.touchMove(img, { touches: [] })).not.toThrow();
  });
});
