import { useEffect, useState } from 'react';

/**
 * Creates and manages an object URL for a Blob, revoking it when the blob
 * changes or the component unmounts. Each mount owns a fresh URL, avoiding
 * stale references when effects re-run (e.g. React StrictMode double-invoke).
 */
export function useObjectUrl(blob: Blob | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);
  return url;
}
