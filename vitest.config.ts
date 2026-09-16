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
    // The env contract fails fast on import (src/lib/env.ts); tests get the 1a minimum and
    // nothing else: CI's job-level production origin and mock transports must not leak into
    // unit tests that assert the unconfigured defaults.
    env: {
      NEXT_PUBLIC_APP_URL: 'https://b7r.app',
      NEXT_PUBLIC_SITE_URL: '',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: '',
      PAYLOAD_SECRET: '',
      NEWSLETTER_TRANSPORT: '',
      CONTACT_TRANSPORT: '',
      RESEND_API_KEY: '',
      TURNSTILE_SECRET_KEY: '',
      INDEXNOW_KEY: '',
      B7R_RUNTIME: '',
    },
  },
});
