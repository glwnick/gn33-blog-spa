// Runtime configuration placeholder.
//
// In production the container's /docker-entrypoint.d/10-runtime-config.sh overwrites this file from
// environment variables before nginx starts. Leaving it empty here means `pnpm dev` and `pnpm build`
// fall through to the VITE_APP_* values in .env - see src/config/env.ts.
window.__GN33_CONFIG__ = {};
