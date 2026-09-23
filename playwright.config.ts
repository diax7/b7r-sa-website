import nextEnv from '@next/env';
import { defineConfig, devices } from '@playwright/test';

// The admin suite signs in with ADMIN_EMAIL / ADMIN_PASSWORD from .env.local (CI sets them).
nextEnv.loadEnvConfig(process.cwd());

const PORT = 3004;
export const BASE_URL = `http://localhost:${PORT}`;
/** Suites that mutate the CMS (one serial file). */
const CMS_SPECS = '**/admin.spec.ts';
/**
 * The bookings suite (ADR-062) mutates the CMS too (it switches the booking global on and
 * signs in as the admin), so it is a project of its own that runs after the admin suite:
 * two files in one project would run in two workers at once, and the one admin account's
 * parallel logins race on its sessions list (a later login drops an earlier session's id,
 * and the earlier suite's writes answer 403).
 */
const BOOKING_SPECS = '**/bookings.spec.ts';
/**
 * The Appearance suite (spec 010) repaints the whole site (the colours, the typeface): a
 * project of its own after the bookings suite, so no public assertion runs while the site
 * wears another blue.
 */
const APPEARANCE_SPECS = '**/appearance.spec.ts';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  // Eight workers on a developer machine starve the emulated WebKit projects (taps land late,
  // a stepper click is lost): four keep the interaction tests honest. CI keeps its default.
  ...(process.env['CI'] ? {} : { workers: 4 }),
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
      testIgnore: [CMS_SPECS, BOOKING_SPECS, APPEARANCE_SPECS],
    },
    {
      name: 'pixel-7',
      use: { ...devices['Pixel 7'] },
      testIgnore: [CMS_SPECS, BOOKING_SPECS, APPEARANCE_SPECS],
    },
    {
      name: 'iphone-15',
      use: { ...devices['iPhone 15'] },
      testIgnore: [CMS_SPECS, BOOKING_SPECS, APPEARANCE_SPECS],
    },
    {
      // The admin suite publishes, drafts and switches sections off: it runs alone, after the
      // device projects, so a mutation never overlaps a public assertion on another worker.
      // A red device project skips it (Playwright dependencies): fix the public failure first.
      // The panel speaks the browser's language until the account page sets it (ADR-056), so
      // this browser is English: the suite reads English, the Arabic test switches through
      // the account page, and a fresh Arabic-browser context asserts the default.
      name: 'cms',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        locale: 'en-US',
      },
      testMatch: CMS_SPECS,
      dependencies: ['desktop-chrome', 'pixel-7', 'iphone-15'],
    },
    {
      // After the admin suite, never beside it (the one admin account, above); an Arabic
      // browser, since the merchant's pages are the site's.
      name: 'cms-bookings',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
      testMatch: BOOKING_SPECS,
      dependencies: ['cms'],
    },
    {
      // After the bookings suite (the one admin account, above); an English panel, like the
      // admin suite, which switches to Arabic for its second pass.
      name: 'cms-appearance',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        locale: 'en-US',
      },
      testMatch: APPEARANCE_SPECS,
      dependencies: ['cms-bookings'],
    },
  ],
});
