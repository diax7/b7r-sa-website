import nextEnv from '@next/env';
import { defineConfig, devices } from '@playwright/test';

// The admin suite signs in with ADMIN_EMAIL / ADMIN_PASSWORD from .env.local (CI sets them).
nextEnv.loadEnvConfig(process.cwd());

const PORT = 3004;
export const BASE_URL = `http://localhost:${PORT}`;
/** Suites that mutate the CMS (one serial file). */
const CMS_SPECS = '**/admin.spec.ts';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['html', { open: 'never' }], ['github']] : 'list',
  use: {
    baseURL: BASE_URL,
    locale: 'ar-SA',
    trace: 'on-first-retry',
  },
  // CI warms the ISR entries and image transforms before the first test (a cold AVIF
  // transform on the runner stalls the load event); Playwright runs it after the server is up.
  ...(process.env['CI'] ? { globalSetup: './e2e/global-setup.ts' } : {}),
  webServer: {
    command: 'pnpm start',
    url: BASE_URL,
    reuseExistingServer: !process.env['CI'],
    timeout: 60_000,
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
      testIgnore: CMS_SPECS,
    },
    { name: 'pixel-7', use: { ...devices['Pixel 7'] }, testIgnore: CMS_SPECS },
    { name: 'iphone-15', use: { ...devices['iPhone 15'] }, testIgnore: CMS_SPECS },
    {
      // The admin suite publishes, drafts and switches sections off: it runs alone, after the
      // device projects, so a mutation never overlaps a public assertion on another worker.
      name: 'cms',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
      testMatch: CMS_SPECS,
      dependencies: ['desktop-chrome', 'pixel-7', 'iphone-15'],
    },
  ],
});
