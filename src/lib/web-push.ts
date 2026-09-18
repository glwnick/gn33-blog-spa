// Decodes a base64url-encoded VAPID public key (the format the backend serves) into the raw byte array the
// browser's `pushManager.subscribe({ applicationServerKey })` requires. Built via `new Uint8Array(length)`
// rather than `Uint8Array.from` so it stays backed by a plain ArrayBuffer (not the wider ArrayBufferLike,
// which includes SharedArrayBuffer) - the only form BufferSource accepts.
export const urlBase64ToUint8Array = (
  base64Url: string,
): Uint8Array<ArrayBuffer> => {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replaceAll('-', '+').replaceAll(
    '_',
    '/',
  );
  const rawData = atob(base64);
  const bytes = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    bytes[i] = rawData.charCodeAt(i);
  }
  return bytes;
};
