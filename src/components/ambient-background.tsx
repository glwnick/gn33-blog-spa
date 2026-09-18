/**
 * Soft, drifting gradient backdrop for full-bleed pages (currently just /about).
 *
 * Replaces an autoplaying 30s 1080p bg.mp4 loop that had to be decoded and composited
 * continuously for as long as the page stayed open. This is two blurred radial-gradient
 * layers panned via `background-position` (the already-defined `--animate-aurora`
 * keyframe in src/styles.css), which is orders of magnitude cheaper than video decode
 * and needs no network fetch of a multi-megabyte asset.
 *
 * Colours come from the theme's own chart palette so it re-themes for light/dark for
 * free, unlike the old video which relied on an `invert dark:invert-0` filter trick.
 */
export const AmbientBackground = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden bg-background"
    >
      <div
        className="animate-aurora absolute -inset-1/4 opacity-15 blur-3xl dark:opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, var(--chart-2) 0%, transparent 55%), radial-gradient(circle at 80% 70%, var(--chart-4) 0%, transparent 55%)',
          backgroundSize: '200% 200%',
        }}
      />
      <div
        className="animate-aurora absolute -inset-1/4 opacity-15 blur-3xl [animation-direction:reverse] [animation-duration:90s] dark:opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 70% 20%, var(--chart-1) 0%, transparent 50%), radial-gradient(circle at 25% 80%, var(--chart-3) 0%, transparent 50%)',
          backgroundSize: '180% 180%',
        }}
      />
    </div>
  );
};
