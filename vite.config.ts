import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import { tanstackStart } from '@tanstack/react-start/plugin/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Supersedes the standalone `@tanstack/router-plugin/vite` router plugin: it still owns
    // route-tree codegen, but also adds the SSR client/server build graph. Must come before
    // `viteReact()`.
    tanstackStart({
      // Vitest has no client/server build split - every test file is transformed as one
      // environment - so the plugin cannot tell a genuine leak of `@tanstack/react-start/server`
      // into client code (a real build error, still enforced by `pnpm build`) apart from a test
      // that legitimately imports a server-only module like `lib/server-auth.ts` directly to unit
      // test it. Disabled here, under `process.env.VITEST` only, so this carve-out cannot weaken
      // `pnpm build`, `pnpm dev` or the production bundle.
      importProtection: process.env.VITEST ? { enabled: false } : undefined,
    }),
    viteReact(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
  },
});
