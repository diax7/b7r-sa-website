import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // `server-only` throws outside a React server environment; tests exercise the modules directly.
      'server-only': fileURLToPath(new URL('./tests/stubs/server-only.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    globals: false,
    // The env contract fails fast on import (src/lib/env.ts); tests get the 1a minimum.
    env: { NEXT_PUBLIC_APP_URL: 'https://b7r.app', NEXT_PUBLIC_WHATSAPP: '966501699572' },
  },
});
