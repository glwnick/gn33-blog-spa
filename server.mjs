// Production entry point for the built Start app. Not used in dev (`pnpm dev` runs Vite's own
// dev server) or in tests - only by the Docker image's runtime stage.
//
// Start's Vite build produces a `dist/server/server.js` bundle exporting a Web-standard
// `{ fetch(request): Response }` handler, not a self-starting server: on plain Node hosting
// (as opposed to Cloudflare Workers/Deno/Bun) something has to serve `dist/client` as static
// assets and forward everything else to that handler. `srvx` (already a transitive dependency of
// the built server bundle) provides the server; the static half is `serveClientAssets` below.
//
// It does *not* use `srvx/static`, deliberately. That helper sets no `Cache-Control`, no `ETag`
// and no `Last-Modified`, ignores `Range`, and brotli-compresses any file the client will accept
// compressed - which for `public/bg.mp4` (6.5 MB of already-compressed video) means quality-11
// brotli on every single request, for no byte saving, on the landing page. All four behaviours
// were things `nginx.conf` got right and are reproduced here.
import { createReadStream } from 'node:fs';
import { stat, writeFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { createBrotliCompress, createGzip, constants as zlib } from 'node:zlib';
import { FastResponse, serve } from 'srvx/node';
import serverEntry from './dist/server/server.js';

const CLIENT_DIR = resolve('./dist/client') + sep;

// Replaces the old nginx image's `docker-entrypoint.d/10-runtime-config.sh`, which regenerated
// `config.js` from the environment before nginx started - there is no such hook here, so this
// entry point does it itself before serving. Same env vars, same fail-fast behaviour: an unset
// `APP_API_URL` does not produce an obvious error otherwise - the app loads, and only the
// calendar feed URL and the service worker's API base come out broken, which nobody notices
// until a member reports their calendar stopped syncing. See `src/config/env.ts`.
const apiUrl = process.env.APP_API_URL;
if (!apiUrl) {
  console.error(
    'server.mjs: APP_API_URL is required (the full public origin, e.g. https://app.gn33.eu)',
  );
  process.exit(1);
}
await writeFile(
  join(CLIENT_DIR, 'config.js'),
  `window.__GN33_CONFIG__ = ${JSON.stringify({
    apiUrl,
    issuer: process.env.APP_ISSUER || 'gn33',
    env: process.env.APP_ENV || 'prod',
  })};\n`,
);

const MIME_TYPES = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.eot': 'application/vnd.ms-fontobject',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/vnd.microsoft.icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.webm': 'video/webm',
  // Not in srvx's table, and not in nginx's default `mime.types` either, so this is the first
  // time it is served correctly. The manifest is what unlocks Web Push on installed iOS Safari.
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.zip': 'application/zip',
};

// Only formats that actually shrink. nginx's `gzip_types` made the same distinction; compressing
// png/woff2/mp4 spends CPU to grow the payload.
const COMPRESSIBLE = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.map',
  '.mjs',
  '.svg',
  '.txt',
  '.webmanifest',
  '.xml',
]);

/**
 * One rule per `location` block the old `nginx.conf` had, and for the same stated reasons.
 */
const cacheControlFor = (pathname) => {
  // Rewritten from the environment on every container start, so a cached copy would leave
  // browsers talking to the *previous* deploy's API origin.
  if (pathname === '/config.js') return 'no-store';
  // A cached service worker is a long-lived bug: it keeps running the old code on every visit.
  if (pathname === '/sw.js') return 'no-store';
  // Vite hashes everything under /assets/, so the content can never change behind the URL.
  if (pathname.startsWith('/assets/')) {
    return 'public, max-age=31536000, immutable';
  }
  // Everything else is a hand-placed file from `public/` (logos, bg.mp4, the manifest) whose URL
  // is stable across deploys. nginx gave these a year as well, by extension match - which meant a
  // replaced logo could not propagate for a year. A day plus the ETag below keeps them
  // effectively free to re-request while letting a swap actually land.
  return 'public, max-age=86400, must-revalidate';
};

const compressionFor = (acceptEncoding, ext) => {
  if (!COMPRESSIBLE.has(ext)) return null;
  if (acceptEncoding.includes('br')) return 'br';
  if (acceptEncoding.includes('gzip')) return 'gzip';
  return null;
};

const compressorFor = (encoding) =>
  encoding === 'br'
    ? // Quality 5, not the library default of 11. 11 is a build-time setting; at request time it
      // costs seconds of CPU per megabyte for a few percent over 5.
      createBrotliCompress({
        params: { [zlib.BROTLI_PARAM_QUALITY]: 5 },
      })
    : createGzip();

/** Single `bytes=first-last` ranges only, which is all a `<video>` element asks for. */
const parseRange = (header, size) => {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header?.trim() ?? '');
  if (!match) return null;
  const [, rawStart, rawEnd] = match;
  if (rawStart === '' && rawEnd === '') return null;
  // A suffix range (`bytes=-500`) means "the last 500 bytes".
  const start = rawStart === '' ? size - Number(rawEnd) : Number(rawStart);
  const end = rawStart === '' ? size - 1 : Math.min(Number(rawEnd || size - 1), size - 1);
  if (!Number.isFinite(start) || start < 0 || start > end) return null;
  return { start, end };
};

/**
 * Serves `dist/client` for requests that map to a real file, and falls through to the SSR handler
 * for everything else. No `.html` guessing: under Start the router owns every non-file URL.
 */
const serveClientAssets = async (request, next) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') return next();

  const { pathname } = new URL(request.url);
  let filePath;
  try {
    filePath = join(CLIENT_DIR, decodeURIComponent(pathname));
  } catch {
    // Malformed percent-encoding. Not ours to serve; let the SSR handler answer it.
    return next();
  }
  // Containment check against `..` and encoded traversal in the request path.
  if (!filePath.startsWith(CLIENT_DIR)) return next();

  const fileStat = await stat(filePath).catch(() => null);
  if (!fileStat?.isFile()) return next();

  const ext = extname(filePath).toLowerCase();
  const headers = {
    'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    'Cache-Control': cacheControlFor(pathname),
    'Accept-Ranges': 'bytes',
    ETag: `W/"${fileStat.size.toString(16)}-${Math.trunc(
      fileStat.mtimeMs,
    ).toString(16)}"`,
    'Last-Modified': fileStat.mtime.toUTCString(),
  };

  if (request.headers.get('if-none-match') === headers.ETag) {
    return new FastResponse(null, { status: 304, headers });
  }

  // Range and Content-Encoding do not mix - the offsets a client asks for are offsets into the
  // identity encoding. Serving the video uncompressed is the right answer anyway, and Safari
  // will not play a video whose `Range: bytes=0-1` probe comes back as a 200.
  const range = parseRange(request.headers.get('range'), fileStat.size);
  if (range) {
    const { start, end } = range;
    headers['Content-Range'] = `bytes ${start}-${end}/${fileStat.size}`;
    headers['Content-Length'] = String(end - start + 1);
    return new FastResponse(
      request.method === 'HEAD'
        ? null
        : createReadStream(filePath, { start, end }),
      { status: 206, headers },
    );
  }

  const encoding = compressionFor(
    request.headers.get('accept-encoding') || '',
    ext,
  );
  if (encoding) {
    headers['Content-Encoding'] = encoding;
    // Vary regardless of whether this particular response was compressed, so a shared cache
    // cannot hand a compressed body to a client that did not ask for one.
    headers.Vary = 'Accept-Encoding';
  } else {
    headers['Content-Length'] = String(fileStat.size);
    if (COMPRESSIBLE.has(ext)) headers.Vary = 'Accept-Encoding';
  }

  if (request.method === 'HEAD') {
    return new FastResponse(null, { headers });
  }
  const stream = createReadStream(filePath);
  return new FastResponse(
    encoding ? stream.pipe(compressorFor(encoding)) : stream,
    { headers },
  );
};

// Carried over from `nginx-security-headers.conf`, which added these to every response because
// nginx's own `add_header` does not inherit into a location that sets a header of its own - the
// same reasoning applies here: set them on everything, not just the SSR'd document.
// L3, SECURITY-AUDIT-2026-09-15.md: report-only for now, as the audit itself recommends - it logs violations
// to the browser console without blocking anything, so getting the allow-list slightly wrong cannot break
// login or the OAuth2 redirect round-trip the way an enforcing policy shipped on day one could. Promote to a
// real Content-Security-Policy header once a deploy cycle's worth of real traffic has produced no
// unexpected violations.
//
// `script-src` takes a per-request nonce rather than `'unsafe-inline'`: TanStack Start streams several
// inline `<script>` tags per document (the dehydration/hydration payload, React's own Suspense streaming
// barrier scripts, and `routes/__root.tsx`'s theme-init script), and the dehydration payload's content -
// and therefore its hash - differs per request, so a `'sha256-...'` allowlist can never cover it. `src/lib/
// server-csp.ts` generates the nonce inside the SSR render (where `createRouter`'s `ssr.nonce` option
// threads it into every one of those scripts - see that file's header) and publishes it here via a
// throwaway `X-Csp-Nonce` response header, since this file is a plain Node entry point outside the
// Vite/Start build and cannot import from `src/`.
//
// No `'unsafe-eval'`: the one violation it would silence is Zod v4 feature-detecting JIT compilation
// support via a `try { Function('') } catch {}` probe (see `zod`'s own `jitless-allows-eval` test) - under
// an enforcing CSP the probe throws, is caught, and Zod falls back to its slower interpreted validator with
// no functional change. Report-only mode doesn't block the probe, so it still logs, but there is nothing to
// fix: adding `'unsafe-eval'` would trade a real XSS-amplification risk for schema validation a few
// microseconds faster.
//
// `apiUrl` is the same runtime-configured origin `config.js` embeds, resolved once at boot (see the top of
// this file) - not per-visitor state, so module scope is safe here per this app's own hard rule on that.
const buildContentSecurityPolicyReportOnly = (nonce) =>
  [
    "default-src 'self'",
    `connect-src 'self' ${apiUrl}`,
    // `blob:` is where the avatar/thumbnail images render from (`URL.createObjectURL` on a fetched
    // image blob - see `hooks/use-object-url.ts`), not a network origin `apiUrl` can cover.
    `img-src 'self' data: blob: ${apiUrl}`,
    `script-src 'self'${nonce ? ` 'nonce-${nonce}'` : ''}`,
    // 'unsafe-inline' on style-src: React's inline `style={{...}}` props are covered by CSP's style-src, and a
    // report-only policy that floods the console with expected inline-style violations from day one defeats
    // the point of watching for real ones first.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "media-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    // Matches X-Frame-Options: DENY below, expressed the modern way too.
    "frame-ancestors 'none'",
  ].join('; ');

const withSecurityHeaders = async (request, next) => {
  const response = await next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  // Set by `src/lib/server-csp.ts` for an SSR'd document; absent for a static asset response (a .js/.css
  // file served straight from `dist/client`), which never reaches a browser as the protected document and
  // so gets the same policy without a nonce - a `script-src 'self'` with no matching inline scripts either way.
  const nonce = response.headers.get('X-Csp-Nonce');
  response.headers.delete('X-Csp-Nonce');
  response.headers.set(
    'Content-Security-Policy-Report-Only',
    buildContentSecurityPolicyReportOnly(nonce),
  );
  return response;
};

const port = Number(process.env.PORT) || 8080;

serve({
  port,
  middleware: [withSecurityHeaders, serveClientAssets],
  fetch: (request) => serverEntry.fetch(request),
});

console.log(`Listening on port ${port}`);
