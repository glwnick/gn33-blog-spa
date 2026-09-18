/**
 * Saves a downloaded blob to disk via a temporary object URL + anchor click,
 * matching the browser-download convention used for other blob downloads.
 */
export const saveBlobAsFile = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const FILENAME_STAR = /filename\*=\s*(?:UTF-8'')?([^;]+)/i;
const FILENAME_QUOTED = /filename=\s*"([^"]*)"/i;
const FILENAME_PLAIN = /filename=\s*([^;]+)/i;

/**
 * Reads the filename out of a `Content-Disposition` header, so a download saves under the name the server
 * chose rather than one the SPA composes for itself - the backend brands and dates these names from
 * `app.branding.*`, which the SPA has no copy of. Returns null when the header is absent or carries no
 * usable filename, leaving the caller to fall back.
 *
 * <p>The header only reaches JavaScript because `SecurityConfig`'s CORS config exposes it; on a same-origin
 * deployment it is readable regardless.
 */
export const fileNameFromContentDisposition = (
  header: string | null | undefined,
): string | null => {
  if (!header) {
    return null;
  }

  // RFC 5987's `filename*` wins when both are present: it is the encoded form, and a server sending both
  // sends the plain one only as a fallback for clients that cannot decode it.
  const raw =
    FILENAME_STAR.exec(header)?.[1] ??
    FILENAME_QUOTED.exec(header)?.[1] ??
    FILENAME_PLAIN.exec(header)?.[1];
  if (raw === undefined) {
    return null;
  }

  let decoded = raw.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // A stray percent sign is not a reason to lose an otherwise usable name.
  }

  // Never let a header decide where the file lands: keep the basename only.
  const fileName = decoded.replace(/^.*[\\/]/, '').trim();
  return fileName === '' ? null : fileName;
};
