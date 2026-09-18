import { useCallback, useRef } from 'react';

type UseIntersectionObserverOptions = {
  readonly onIntersect: () => void;
  readonly enabled?: boolean;
};

/**
 * Returns a `ref` callback that attaches an IntersectionObserver to the
 * element it is bound to. When the element enters the viewport, `onIntersect`
 * is called once per intersection while `enabled` is true.
 */
export function useIntersectionObserver({
  onIntersect,
  enabled = true,
}: UseIntersectionObserverOptions): (node: HTMLDivElement | null) => void {
  const observerRef = useRef<IntersectionObserver | null>(null);
  return useCallback(
    (node: HTMLDivElement | null) => {
      observerRef.current?.disconnect();
      if (!node || !enabled) return;
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) onIntersect();
        },
        { rootMargin: '100px' },
      );
      observerRef.current.observe(node);
    },
    [enabled, onIntersect],
  );
}
