// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * env.ts reads window.__GN33_CONFIG__ once, at module load, so every case here has to set the global
 * first and then import the module fresh.
 */
const loadEnv = async () => {
  vi.resetModules();
  return (await import('./env')).default;
};

describe('runtime configuration', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_APP_API_URL', 'http://localhost:8080');
    vi.stubEnv('VITE_APP_ISSUER', 'gn33-dev');
    vi.stubEnv('VITE_APP_ENV', 'dev');
    vi.stubEnv('VITE_APP_ENABLE_API_MOCKING', 'false');
  });

  afterEach(() => {
    delete window.__GN33_CONFIG__;
    vi.unstubAllEnvs();
  });

  it('prefers the container-injected config over the build-time values', async () => {
    window.__GN33_CONFIG__ = {
      apiUrl: 'https://blog.gn33.eu',
      issuer: 'gn33',
      env: 'prod',
    };

    const env = await loadEnv();

    expect(env.API_URL).toBe('https://blog.gn33.eu');
    expect(env.ISSUER).toBe('gn33');
    expect(env.IS_DEVELOPMENT).toBe(false);
  });

  it('falls back to the build-time values when /config.js is the dev no-op', async () => {
    // public/config.js sets an empty object, which is what `pnpm dev` and `pnpm build` see.
    window.__GN33_CONFIG__ = {};

    const env = await loadEnv();

    expect(env.API_URL).toBe('http://localhost:8080');
    expect(env.ISSUER).toBe('gn33-dev');
    expect(env.IS_DEVELOPMENT).toBe(true);
  });

  it('falls back when /config.js failed to load at all', async () => {
    const env = await loadEnv();

    expect(env.API_URL).toBe('http://localhost:8080');
    expect(env.IS_DEVELOPMENT).toBe(true);
  });

  it('ignores a blank injected apiUrl rather than producing relative URLs', async () => {
    // An empty apiUrl would break the calendar feed URL a member pastes into Google Calendar and the
    // service worker's API base - both have to be absolute. The container entrypoint refuses to start
    // without APP_API_URL for the same reason; this is the second line of defence.
    window.__GN33_CONFIG__ = { apiUrl: '', issuer: '' };

    const env = await loadEnv();

    expect(env.API_URL).toBe('http://localhost:8080');
    expect(env.ISSUER).toBe('gn33-dev');
  });

  // `import.meta.env.SSR` is what env.ts branches on, mutable here via `vi.stubEnv` since Vitest treats it as
  // one of its boolean env flags. `APP_API_URL` is a plain `process.env` read rather than an
  // `import.meta.env` one, since it is not `VITE_`-prefixed - see env.ts's comment - so it is stubbed directly.
  describe('during SSR', () => {
    beforeEach(() => {
      vi.stubEnv('SSR', true);
      process.env.APP_API_URL = 'https://blog.gn33.eu';
    });

    afterEach(() => {
      delete process.env.APP_API_URL;
    });

    it('reads the API base from the server process environment, not window', async () => {
      // `window` is defined under jsdom, but a real SSR render never sees the browser-injected
      // config - this pins the server branch instead of the client one that would otherwise win here.
      window.__GN33_CONFIG__ = {};

      const env = await loadEnv();

      expect(env.API_URL).toBe('https://blog.gn33.eu');
    });

    it('falls back to the build-time value when APP_API_URL is unset, for pnpm dev', async () => {
      delete process.env.APP_API_URL;

      const env = await loadEnv();

      expect(env.API_URL).toBe('http://localhost:8080');
    });
  });
});
