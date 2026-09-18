import { useEffect, useState } from 'react';

type CountdownResult = {
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly isPast: boolean;
};

function computeCountdown(target: Date): CountdownResult {
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, isPast: false };
}

/**
 * Returns a live-ticking countdown to the given target date.
 * Updates every second while the target is in the future.
 */
export function useCountdown(target: Date): CountdownResult {
  const [result, setResult] = useState<CountdownResult>(() =>
    computeCountdown(target),
  );
  useEffect(() => {
    if (result.isPast) return;
    const id = setInterval(() => {
      const next = computeCountdown(target);
      setResult(next);
      if (next.isPast) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [target, result.isPast]);
  return result;
}
